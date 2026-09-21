const {
  TILE_SIZE, COLS, ROWS, TANK_SIZE, HALF_TANK,
  DIR_DX, DIR_DY, TILE,
  BULLET_SPEED, ENEMY_BULLET_SPEED,
} = require('./consts')

class Tank {
  constructor(x, y, dir, isPlayer, type) {
    this.x = x
    this.y = y
    this.dir = dir
    this.isPlayer = isPlayer
    this.type = type || 'BASIC'
    this.alive = true
    this.speed = isPlayer ? 2.5 : (type === 'FAST' ? 2.5 : type === 'POWER' ? 1.5 : 1.2)
    this.bulletSpeed = isPlayer ? BULLET_SPEED : (type === 'POWER' ? 5 : 3)
    this.hp = isPlayer ? 1 : (type === 'ARMOR' ? 4 : 1)
    this.maxHp = this.hp
    this.fireCooldown = 0
    this.fireRate = isPlayer ? 500 : (type === 'POWER' ? 1200 : 2000)
    this.shield = 0
    this.spawnAnim = 0
    this.animFrame = 0
    this.animTimer = 0
    this.frozen = false
  }

  get cx() { return this.x + HALF_TANK }
  get cy() { return this.y + HALF_TANK }

  update(dt, input, map, tanks) {
    if (this.spawnAnim > 0) {
      this.spawnAnim -= dt
      return
    }
    if (this.shield > 0) this.shield -= dt
    if (this.fireCooldown > 0) this.fireCooldown -= dt

    this.animTimer += dt
    if (this.animTimer > 100) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 2
    }

    if (this.isPlayer) {
      this._handlePlayerInput(dt, input, map, tanks)
    }
  }

  _handlePlayerInput(dt, input, map, tanks) {
    if (input.dir < 0) return
    const dir = input.dir
    if (dir !== this.dir) {
      this.dir = dir
      this._snapToGrid()
    }
    this._tryMove(dt, map, tanks)
  }

  _snapToGrid() {
    if (this.dir === 0 || this.dir === 2) {
      this.x = Math.round(this.x / (TILE_SIZE / 2)) * (TILE_SIZE / 2)
    } else {
      this.y = Math.round(this.y / (TILE_SIZE / 2)) * (TILE_SIZE / 2)
    }
  }

  _tryMove(dt, map, tanks) {
    const dx = DIR_DX[this.dir] * this.speed
    const dy = DIR_DY[this.dir] * this.speed
    const nx = this.x + dx
    const ny = this.y + dy

    if (nx < 0 || ny < 0 || nx + TANK_SIZE > COLS * TILE_SIZE || ny + TANK_SIZE > ROWS * TILE_SIZE) return

    if (this._collidesMap(nx, ny, map)) return
    if (this._collidesTanks(nx, ny, tanks)) return

    this.x = nx
    this.y = ny
  }

  _collidesMap(nx, ny, map) {
    const margin = 2
    const left = nx + margin
    const top = ny + margin
    const right = nx + TANK_SIZE - margin
    const bottom = ny + TANK_SIZE - margin

    const corners = [
      [left, top], [right, top],
      [left, bottom], [right, bottom],
    ]

    for (const [px, py] of corners) {
      const col = Math.floor(px / TILE_SIZE)
      const row = Math.floor(py / TILE_SIZE)
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue
      const tile = map[row][col]
      if (tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.WATER || tile === TILE.BASE || tile === TILE.BASE_DEAD) {
        return true
      }
    }
    return false
  }

  _collidesTanks(nx, ny, tanks) {
    for (const other of tanks) {
      if (other === this || !other.alive || other.spawnAnim > 0) continue
      if (nx < other.x + TANK_SIZE && nx + TANK_SIZE > other.x &&
          ny < other.y + TANK_SIZE && ny + TANK_SIZE > other.y) {
        return true
      }
    }
    return false
  }

  fire() {
    if (this.fireCooldown > 0 || this.spawnAnim > 0) return null
    this.fireCooldown = this.fireRate
    const cx = this.cx
    const cy = this.cy
    const bx = cx + DIR_DX[this.dir] * HALF_TANK - 4
    const by = cy + DIR_DY[this.dir] * HALF_TANK - 4
    return new Bullet(bx, by, this.dir, this.isPlayer, this.bulletSpeed)
  }

  hit() {
    if (this.shield > 0) return false
    this.hp--
    if (this.hp <= 0) {
      this.alive = false
      return true
    }
    return false
  }

  draw(ctx) {
    if (!this.alive) return

    if (this.spawnAnim > 0) {
      this._drawSpawn(ctx)
      return
    }

    ctx.save()
    ctx.translate(this.cx, this.cy)
    ctx.rotate(this.dir * Math.PI / 2)

    let bodyColor, turretColor, trackColor
    if (this.isPlayer) {
      bodyColor = '#E8C820'
      turretColor = '#D0B018'
      trackColor = '#A08010'
    } else {
      if (this.type === 'ARMOR') {
        const hpRatio = this.hp / this.maxHp
        bodyColor = hpRatio > 0.75 ? '#40C0C0' : hpRatio > 0.5 ? '#C0C040' : hpRatio > 0.25 ? '#C08040' : '#C04040'
        turretColor = '#308080'
        trackColor = '#206060'
      } else if (this.type === 'FAST') {
        bodyColor = '#40A040'
        turretColor = '#308030'
        trackColor = '#206020'
      } else if (this.type === 'POWER') {
        bodyColor = '#D0D040'
        turretColor = '#B0B030'
        trackColor = '#808020'
      } else {
        bodyColor = '#C0C0C0'
        turretColor = '#A0A0A0'
        trackColor = '#808080'
      }
    }

    const trackOffset = this.animFrame * 3
    ctx.fillStyle = trackColor
    ctx.fillRect(-HALF_TANK, -HALF_TANK, 8, TANK_SIZE)
    ctx.fillRect(HALF_TANK - 8, -HALF_TANK, 8, TANK_SIZE)
    for (let i = 0; i < 5; i++) {
      const ty = -HALF_TANK + 2 + i * 9 + trackOffset
      ctx.fillStyle = '#333'
      ctx.fillRect(-HALF_TANK, ty, 8, 2)
      ctx.fillRect(HALF_TANK - 8, ty, 8, 2)
    }

    ctx.fillStyle = bodyColor
    ctx.fillRect(-14, -16, 28, 32)

    ctx.fillStyle = turretColor
    ctx.beginPath()
    ctx.arc(0, 0, 9, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = turretColor
    ctx.fillRect(-3, -HALF_TANK, 6, HALF_TANK - 4)

    ctx.restore()

    if (this.shield > 0) {
      this._drawShield(ctx)
    }
  }

  _drawSpawn(ctx) {
    const progress = 1 - this.spawnAnim / 1500
    const flash = Math.floor(progress * 10) % 2
    ctx.save()
    ctx.globalAlpha = 0.5 + progress * 0.5
    ctx.strokeStyle = flash ? '#FFFFFF' : '#80FFFF'
    ctx.lineWidth = 2
    const size = TANK_SIZE * (0.3 + progress * 0.7)
    ctx.strokeRect(this.cx - size / 2, this.cy - size / 2, size, size)
    ctx.restore()
  }

  _drawShield(ctx) {
    const flash = Math.floor(this.shield / 100) % 2
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.strokeStyle = flash ? '#80FFFF' : '#FFFFFF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(this.cx, this.cy, HALF_TANK + 3, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

class Bullet {
  constructor(x, y, dir, isPlayer, speed) {
    this.x = x
    this.y = y
    this.dir = dir
    this.isPlayer = isPlayer
    this.speed = speed
    this.alive = true
    this.w = 8
    this.h = 8
  }

  update() {
    this.x += DIR_DX[this.dir] * this.speed
    this.y += DIR_DY[this.dir] * this.speed

    if (this.x < 0 || this.y < 0 ||
        this.x + this.w > COLS * TILE_SIZE ||
        this.y + this.h > ROWS * TILE_SIZE) {
      this.alive = false
    }
  }

  draw(ctx) {
    if (!this.alive) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(this.x, this.y, this.w, this.h)
  }
}

module.exports = { Tank, Bullet }
