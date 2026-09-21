const {
  TILE_SIZE, COLS, ROWS, PLAY_W, PLAY_H, HUD_W, TANK_SIZE, HALF_TANK,
  TILE, DIR, DIR_DX, DIR_DY, STATE, COLORS,
  PLAYER_SPEED, ENEMY_SPEED, BULLET_SPEED, ENEMY_BULLET_SPEED,
  PLAYER_FIRE_CD, ENEMY_FIRE_CD, ENEMY_DIR_CHANGE_MS,
  MAX_ENEMIES_ON_SCREEN, ENEMIES_PER_LEVEL, PLAYER_START_LIVES,
  SHIELD_DURATION, SPAWN_INVULN, ENEMY_TYPES,
} = require('./consts')
const { Input } = require('./input')
const { Tank, Bullet } = require('./entity')
const { Explosion, ScorePopup } = require('./particles')
const { LEVELS, ENEMY_WAVES, SPAWN_POINTS, PLAYER_SPAWN } = require('./maps')

class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.input = new Input(canvas)
    this.state = STATE.MENU
    this.level = 0
    this.score = 0
    this.lives = PLAYER_START_LIVES
    this.map = null
    this.player = null
    this.enemies = []
    this.bullets = []
    this.explosions = []
    this.popups = []
    this.enemyQueue = []
    this.spawnTimer = 0
    this.spawnIndex = 0
    this.totalEnemies = 0
    this.killedEnemies = 0
    this.stateTimer = 0
    this.menuBlink = 0
  }

  startLevel(index) {
    this.level = index
    if (index >= LEVELS.length) {
      this.state = STATE.WIN
      this.stateTimer = 0
      return
    }
    this.map = LEVELS[index].map(r => [...r])
    this.enemies = []
    this.bullets = []
    this.explosions = []
    this.popups = []
    this.spawnIndex = 0
    this.spawnTimer = 0
    this.killedEnemies = 0

    this.enemyQueue = []
    const wave = ENEMY_WAVES[index] || ENEMY_WAVES[0]
    for (const group of wave) {
      for (let i = 0; i < group.count; i++) {
        this.enemyQueue.push(group.type)
      }
    }
    this.totalEnemies = this.enemyQueue.length

    this.player = new Tank(PLAYER_SPAWN.x, PLAYER_SPAWN.y, 0, true)
    this.player.shield = SHIELD_DURATION
    this.player.spawnAnim = 0

    this.state = STATE.PLAYING
  }

  update(dt) {
    this.menuBlink += dt

    if (this.state === STATE.MENU) {
      const tap = this.input.consumeTap()
      if (tap || this.input.firing) {
        this.lives = PLAYER_START_LIVES
        this.score = 0
        this.startLevel(0)
      }
      return
    }

    if (this.state === STATE.GAMEOVER || this.state === STATE.WIN) {
      this.stateTimer += dt
      const tap = this.input.consumeTap()
      if (this.stateTimer > 2000 && (tap || this.input.firing)) {
        this.state = STATE.MENU
      }
      return
    }

    if (this.state === STATE.LEVEL_CLEAR) {
      this.stateTimer += dt
      if (this.stateTimer > 2000) {
        this.startLevel(this.level + 1)
      }
      return
    }

    if (this.state !== STATE.PLAYING) return
    this.input.consumeTap()

    this._updatePlayer(dt)
    this._updateEnemies(dt)
    this._updateBullets(dt)
    this._updateEffects(dt)
    this._spawnEnemies(dt)
    this._checkWinCondition()
  }

  _updatePlayer(dt) {
    if (!this.player || !this.player.alive) return
    this.player.update(dt, this.input, this.map, this.enemies)

    if (this.input.firing) {
      const bullet = this.player.fire()
      if (bullet) this.bullets.push(bullet)
    }
  }

  _updateEnemies(dt) {
    const allTanks = [this.player, ...this.enemies].filter(t => t && t.alive)

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue

      enemy._aiTimer = (enemy._aiTimer || 0) + dt
      if (enemy._aiTimer > ENEMY_DIR_CHANGE_MS || enemy._blocked) {
        enemy._aiTimer = 0
        enemy._blocked = false
        this._aiChooseDir(enemy)
      }

      const oldX = enemy.x
      const oldY = enemy.y
      const dx = DIR_DX[enemy.dir] * enemy.speed
      const dy = DIR_DY[enemy.dir] * enemy.speed
      const nx = enemy.x + dx
      const ny = enemy.y + dy

      if (nx < 0 || ny < 0 || nx + TANK_SIZE > PLAY_W || ny + TANK_SIZE > PLAY_H ||
          enemy._collidesMap(nx, ny, this.map) || enemy._collidesTanks(nx, ny, allTanks)) {
        enemy._blocked = true
      } else {
        enemy.x = nx
        enemy.y = ny
      }

      enemy.animTimer += dt
      if (enemy.animTimer > 100) {
        enemy.animTimer = 0
        enemy.animFrame = (enemy.animFrame + 1) % 2
      }

      if (enemy.fireCooldown > 0) enemy.fireCooldown -= dt
      if (enemy.shield > 0) enemy.shield -= dt

      const fireChance = Math.random() < 0.02
      if (fireChance && enemy.fireCooldown <= 0 && enemy.spawnAnim <= 0) {
        const bullet = enemy.fire()
        if (bullet) this.bullets.push(bullet)
      }
    }

    this.enemies = this.enemies.filter(e => e.alive)
  }

  _aiChooseDir(enemy) {
    const dirs = [0, 1, 2, 3]
    if (this.player && this.player.alive) {
      const bias = Math.random() < 0.4
      if (bias) {
        if (Math.abs(this.player.cx - enemy.cx) > Math.abs(this.player.cy - enemy.cy)) {
          dirs.unshift(enemy.cx < this.player.cx ? 1 : 3)
        } else {
          dirs.unshift(enemy.cy < this.player.cy ? 2 : 0)
        }
      }
    }
    dirs.push(2)
    enemy.dir = dirs[Math.floor(Math.random() * Math.min(dirs.length, 3))]
  }

  _updateBullets(dt) {
    for (const b of this.bullets) {
      if (!b.alive) continue
      b.update()
      this._checkBulletCollisions(b)
    }
    this.bullets = this.bullets.filter(b => b.alive)
  }

  _checkBulletCollisions(bullet) {
    if (!bullet.alive) return

    const col = Math.floor((bullet.x + 4) / TILE_SIZE)
    const row = Math.floor((bullet.y + 4) / TILE_SIZE)

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr
        const c = col + dc
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
        const tile = this.map[r][c]
        const tx = c * TILE_SIZE
        const ty = r * TILE_SIZE
        if (bullet.x + bullet.w > tx && bullet.x < tx + TILE_SIZE &&
            bullet.y + bullet.h > ty && bullet.y < ty + TILE_SIZE) {
          if (tile === TILE.BRICK) {
            this.map[r][c] = TILE.EMPTY
            bullet.alive = false
            this.explosions.push(new Explosion(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, false))
          } else if (tile === TILE.STEEL) {
            bullet.alive = false
            this.explosions.push(new Explosion(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, false))
          } else if (tile === TILE.BASE) {
            this.map[r][c] = TILE.BASE_DEAD
            bullet.alive = false
            this.explosions.push(new Explosion(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, true))
            this._gameOver()
          }
        }
      }
    }

    if (!bullet.alive) return

    if (bullet.isPlayer) {
      for (const enemy of this.enemies) {
        if (!enemy.alive || enemy.spawnAnim > 0) continue
        if (bullet.x < enemy.x + TANK_SIZE && bullet.x + bullet.w > enemy.x &&
            bullet.y < enemy.y + TANK_SIZE && bullet.y + bullet.h > enemy.y) {
          bullet.alive = false
          const killed = enemy.hit()
          if (killed) {
            const typeInfo = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.BASIC
            this.score += typeInfo.score
            this.killedEnemies++
            this.explosions.push(new Explosion(enemy.cx, enemy.cy, true))
            this.popups.push(new ScorePopup(enemy.cx, enemy.cy, typeInfo.score))
          }
          return
        }
      }
    } else {
      if (this.player && this.player.alive && this.player.spawnAnim <= 0) {
        const p = this.player
        if (bullet.x < p.x + TANK_SIZE && bullet.x + bullet.w > p.x &&
            bullet.y < p.y + TANK_SIZE && bullet.y + bullet.h > p.y) {
          bullet.alive = false
          const killed = p.hit()
          if (killed) {
            this.explosions.push(new Explosion(p.cx, p.cy, true))
            this.lives--
            if (this.lives <= 0) {
              this._gameOver()
            } else {
              this._respawnPlayer()
            }
          }
        }
      }
    }

    if (!bullet.alive) return

    for (const other of this.bullets) {
      if (other === bullet || !other.alive || other.isPlayer === bullet.isPlayer) continue
      if (bullet.x < other.x + other.w && bullet.x + bullet.w > other.x &&
          bullet.y < other.y + other.h && bullet.y + bullet.h > other.y) {
        bullet.alive = false
        other.alive = false
        return
      }
    }
  }

  _updateEffects(dt) {
    for (const e of this.explosions) e.update(dt)
    this.explosions = this.explosions.filter(e => e.alive)
    for (const p of this.popups) p.update(dt)
    this.popups = this.popups.filter(p => p.alive)
  }

  _spawnEnemies(dt) {
    if (this.spawnIndex >= this.enemyQueue.length) return
    const onScreen = this.enemies.filter(e => e.alive).length
    if (onScreen >= MAX_ENEMIES_ON_SCREEN) return

    this.spawnTimer += dt
    if (this.spawnTimer < 2000) return
    this.spawnTimer = 0

    const sp = SPAWN_POINTS[this.spawnIndex % SPAWN_POINTS.length]
    const type = this.enemyQueue[this.spawnIndex]

    const blocked = [this.player, ...this.enemies].some(t =>
      t && t.alive &&
      sp.x < t.x + TANK_SIZE && sp.x + TANK_SIZE > t.x &&
      sp.y < t.y + TANK_SIZE && sp.y + TANK_SIZE > t.y
    )
    if (blocked) return

    const enemy = new Tank(sp.x, sp.y, 2, false, type)
    enemy.spawnAnim = SPAWN_INVULN
    enemy._aiTimer = 0
    enemy._blocked = false
    this.enemies.push(enemy)
    this.spawnIndex++
  }

  _respawnPlayer() {
    this.player = new Tank(PLAYER_SPAWN.x, PLAYER_SPAWN.y, 0, true)
    this.player.shield = SHIELD_DURATION
    this.player.spawnAnim = SPAWN_INVULN
  }

  _gameOver() {
    this.state = STATE.GAMEOVER
    this.stateTimer = 0
  }

  _checkWinCondition() {
    if (this.spawnIndex >= this.enemyQueue.length && this.enemies.filter(e => e.alive).length === 0) {
      this.state = STATE.LEVEL_CLEAR
      this.stateTimer = 0
    }
  }

  draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const info = wx.getSystemInfoSync()
    const w = Math.max(info.windowWidth, info.windowHeight)
    const h = Math.min(info.windowWidth, info.windowHeight)
    const scale = Math.min(w / 1280, h / 720)
    const ox = (w - 1280 * scale) / 2
    const oy = (h - 720 * scale) / 2

    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)

    if (this.state === STATE.MENU) {
      this._drawMenu(ctx)
    } else if (this.state === STATE.PLAYING || this.state === STATE.LEVEL_CLEAR) {
      this._drawGame(ctx)
      if (this.state === STATE.LEVEL_CLEAR) {
        this._drawLevelClear(ctx)
      }
    } else if (this.state === STATE.GAMEOVER) {
      this._drawGame(ctx)
      this._drawGameOver(ctx)
    } else if (this.state === STATE.WIN) {
      this._drawWin(ctx)
    }

    ctx.restore()
  }

  _drawGame(ctx) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, PLAY_W, PLAY_H)

    this._drawMap(ctx)

    for (const e of this.enemies) e.draw(ctx)
    if (this.player) this.player.draw(ctx)
    for (const b of this.bullets) b.draw(ctx)

    this._drawTreeLayer(ctx)

    for (const e of this.explosions) e.draw(ctx)
    for (const p of this.popups) p.draw(ctx)

    this._drawControls(ctx)
    this._drawHUD(ctx)
  }

  _drawMap(ctx) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.map[r][c]
        const x = c * TILE_SIZE
        const y = r * TILE_SIZE
        if (tile === TILE.BRICK) {
          this._drawBrick(ctx, x, y)
        } else if (tile === TILE.STEEL) {
          this._drawSteel(ctx, x, y)
        } else if (tile === TILE.WATER) {
          this._drawWater(ctx, x, y)
        } else if (tile === TILE.BASE) {
          this._drawBase(ctx, x, y, false)
        } else if (tile === TILE.BASE_DEAD) {
          this._drawBase(ctx, x, y, true)
        }
      }
    }
  }

  _drawTreeLayer(ctx) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] === TILE.TREE) {
          this._drawTree(ctx, c * TILE_SIZE, r * TILE_SIZE)
        }
      }
    }
  }

  _drawBrick(ctx, x, y) {
    ctx.fillStyle = '#B85C28'
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
    ctx.fillStyle = '#8B4513'
    const bw = TILE_SIZE / 4
    const bh = TILE_SIZE / 6
    for (let r = 0; r < 6; r++) {
      const offset = (r % 2) * (bw / 2)
      for (let c = 0; c < 4; c++) {
        ctx.fillRect(x + c * bw + offset, y + r * bh, 1, bh)
      }
      ctx.fillRect(x, y + r * bh, TILE_SIZE, 1)
    }
  }

  _drawSteel(ctx, x, y) {
    ctx.fillStyle = '#A0A0A0'
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
    ctx.fillStyle = '#C8C8C8'
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2)
    ctx.fillRect(x + 2, y + 2, 2, TILE_SIZE - 4)
    ctx.fillStyle = '#707070'
    ctx.fillRect(x + 2, y + TILE_SIZE - 4, TILE_SIZE - 4, 2)
    ctx.fillRect(x + TILE_SIZE - 4, y + 2, 2, TILE_SIZE - 4)
  }

  _drawWater(ctx, x, y) {
    ctx.fillStyle = '#1830A0'
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
    ctx.fillStyle = '#3050D0'
    const t = Date.now() / 500
    for (let i = 0; i < 4; i++) {
      const wy = y + 6 + i * 12 + Math.sin(t + i) * 2
      ctx.fillRect(x + 4, wy, TILE_SIZE - 8, 2)
    }
  }

  _drawTree(ctx, x, y) {
    ctx.fillStyle = '#006800'
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
    ctx.fillStyle = '#008800'
    for (let i = 0; i < 6; i++) {
      const tx = x + (i % 3) * 16 + 2
      const ty = y + Math.floor(i / 3) * 24 + 2
      ctx.fillRect(tx, ty, 12, 10)
    }
  }

  _drawBase(ctx, x, y, dead) {
    if (dead) {
      ctx.fillStyle = '#444'
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
      ctx.fillStyle = '#666'
      ctx.fillRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 20)
    } else {
      ctx.fillStyle = '#333'
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16)
      ctx.fillStyle = '#FF8C00'
      ctx.fillRect(x + 16, y + 14, TILE_SIZE - 32, TILE_SIZE - 28)
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(x + 20, y + 18, 8, 4)
    }
  }

  _drawControls(ctx) {
    const padCX = 130, padCY = 540, padR = 100

    ctx.save()
    ctx.globalAlpha = 0.2
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(padCX, padCY, padR, 0, Math.PI * 2)
    ctx.stroke()

    const arrows = [
      [padCX, padCY - 60, 0],
      [padCX + 60, padCY, 1],
      [padCX, padCY + 60, 2],
      [padCX - 60, padCY, 3],
    ]
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#FFFFFF'
    for (const [ax, ay, dir] of arrows) {
      ctx.save()
      ctx.translate(ax, ay)
      ctx.rotate(dir * Math.PI / 2)
      ctx.beginPath()
      ctx.moveTo(0, -12)
      ctx.lineTo(10, 8)
      ctx.lineTo(-10, 8)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const fireCX = 1150, fireCY = 520, fireR = 60
    ctx.globalAlpha = 0.2
    ctx.strokeStyle = '#FF4444'
    ctx.beginPath()
    ctx.arc(fireCX, fireCY, fireR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#FF4444'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('FIRE', fireCX, fireCY)

    ctx.restore()
  }

  _drawHUD(ctx) {
    const hx = PLAY_W
    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(hx, 0, HUD_W, PLAY_H)

    ctx.fillStyle = '#333'
    ctx.fillRect(hx, 0, 2, PLAY_H)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`LEVEL ${this.level + 1}`, hx + HUD_W / 2, 20)

    ctx.fillStyle = '#888'
    ctx.fillRect(hx + 15, 50, HUD_W - 30, 1)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('SCORE', hx + 15, 65)
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText(this.score.toString(), hx + 15, 88)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px sans-serif'
    ctx.fillText('LIVES', hx + 15, 125)
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = '#E8C820'
      ctx.fillRect(hx + 15 + i * 22, 148, 16, 16)
    }

    ctx.fillStyle = '#888'
    ctx.fillRect(hx + 15, 175, HUD_W - 30, 1)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px sans-serif'
    ctx.fillText('ENEMY', hx + 15, 190)

    const remaining = this.totalEnemies - this.killedEnemies
    const cols = 4
    for (let i = 0; i < remaining; i++) {
      const r = Math.floor(i / cols)
      const c = i % cols
      ctx.fillStyle = '#C04040'
      ctx.fillRect(hx + 15 + c * 22, 215 + r * 22, 16, 16)
    }
  }

  _drawMenu(ctx) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 1280, 720)

    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TANK', 640, 220)
    ctx.fillText('BATTLE', 640, 300)

    ctx.fillStyle = '#E8C820'
    ctx.font = '28px sans-serif'
    ctx.fillText('坦 克 大 战', 640, 370)

    const blink = Math.floor(this.menuBlink / 600) % 2
    if (blink) {
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '24px sans-serif'
      ctx.fillText('TAP TO START', 640, 500)
    }

    ctx.fillStyle = '#666'
    ctx.font = '16px sans-serif'
    ctx.fillText('LEFT: D-PAD  |  RIGHT: FIRE', 640, 600)
  }

  _drawLevelClear(ctx) {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, PLAY_W, PLAY_H)
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('LEVEL CLEAR!', PLAY_W / 2, PLAY_H / 2)
    ctx.restore()
  }

  _drawGameOver(ctx) {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, 1280, 720)
    ctx.fillStyle = '#FF4444'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('GAME OVER', 640, 300)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '28px sans-serif'
    ctx.fillText(`FINAL SCORE: ${this.score}`, 640, 380)
    if (this.stateTimer > 2000) {
      const blink = Math.floor(this.menuBlink / 600) % 2
      if (blink) {
        ctx.fillStyle = '#AAA'
        ctx.font = '22px sans-serif'
        ctx.fillText('TAP TO RETURN', 640, 460)
      }
    }
    ctx.restore()
  }

  _drawWin(ctx) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 1280, 720)
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 56px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('VICTORY!', 640, 260)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '28px sans-serif'
    ctx.fillText('ALL LEVELS CLEARED', 640, 340)
    ctx.fillText(`FINAL SCORE: ${this.score}`, 640, 400)
    const blink = Math.floor(this.menuBlink / 600) % 2
    if (blink) {
      ctx.fillStyle = '#AAA'
      ctx.font = '22px sans-serif'
      ctx.fillText('TAP TO RETURN', 640, 500)
    }
  }
}

module.exports = Game
