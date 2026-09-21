const TILE_SIZE = 48
const COLS = 24
const ROWS = 14
const PLAY_W = COLS * TILE_SIZE
const PLAY_H = ROWS * TILE_SIZE
const HUD_W = 1280 - PLAY_W
const TANK_SIZE = 42
const HALF_TANK = 21

const TILE = { EMPTY: 0, BRICK: 1, STEEL: 2, WATER: 3, TREE: 4, BASE: 5, BASE_DEAD: 6 }

const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 }

const DIR_DX = [0, 1, 0, -1]
const DIR_DY = [-1, 0, 1, 0]

const STATE = { MENU: 0, PLAYING: 1, GAMEOVER: 2, LEVEL_CLEAR: 3, WIN: 4 }

const COLORS = {
  bg: '#000000',
  brick: '#B85C28',
  brickDark: '#8B4513',
  steel: '#A0A0A0',
  steelLight: '#C0C0C0',
  water: '#2040C0',
  waterLight: '#4060E0',
  tree: '#006800',
  treeLight: '#008800',
  base: '#FFD700',
  baseDead: '#666666',
  playerBody: '#E8C820',
  playerTurret: '#D0B018',
  playerTrack: '#A08010',
  enemyBody: '#C0C0C0',
  enemyTurret: '#A0A0A0',
  enemyTrack: '#808080',
  enemyRedBody: '#D04040',
  enemyRedTurret: '#B03030',
  bullet: '#FFFFFF',
  hud: '#1A1A1A',
  hudText: '#FFFFFF',
  hudDim: '#888888',
}

const PLAYER_SPEED = 2.5
const ENEMY_SPEED = 1.5
const BULLET_SPEED = 5
const ENEMY_BULLET_SPEED = 3.5
const PLAYER_FIRE_CD = 500
const ENEMY_FIRE_CD = 2000
const ENEMY_DIR_CHANGE_MS = 2000
const MAX_ENEMIES_ON_SCREEN = 4
const ENEMIES_PER_LEVEL = 10
const PLAYER_START_LIVES = 3
const SHIELD_DURATION = 3000
const SPAWN_INVULN = 1500

const ENEMY_TYPES = {
  BASIC: { speed: 1.2, bulletSpeed: 3, hp: 1, score: 100, color: COLORS.enemyBody },
  FAST: { speed: 2.5, bulletSpeed: 3, hp: 1, score: 200, color: '#40A040' },
  POWER: { speed: 1.5, bulletSpeed: 5, hp: 1, score: 300, color: '#D0D040' },
  ARMOR: { speed: 1.0, bulletSpeed: 3, hp: 4, score: 400, color: '#40C0C0' },
}

module.exports = {
  TILE_SIZE, COLS, ROWS, PLAY_W, PLAY_H, HUD_W, TANK_SIZE, HALF_TANK,
  TILE, DIR, DIR_DX, DIR_DY, STATE, COLORS,
  PLAYER_SPEED, ENEMY_SPEED, BULLET_SPEED, ENEMY_BULLET_SPEED,
  PLAYER_FIRE_CD, ENEMY_FIRE_CD, ENEMY_DIR_CHANGE_MS,
  MAX_ENEMIES_ON_SCREEN, ENEMIES_PER_LEVEL, PLAYER_START_LIVES,
  SHIELD_DURATION, SPAWN_INVULN, ENEMY_TYPES,
}
