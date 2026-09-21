const { TILE, COLS, ROWS } = require('./consts')

const E = TILE.EMPTY
const B = TILE.BRICK
const S = TILE.STEEL
const W = TILE.WATER
const T = TILE.TREE

function createEmpty() {
  const grid = []
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(COLS).fill(E))
  }
  return grid
}

function setBlock(grid, br, bc, type) {
  const r = br * 2
  const c = bc * 2
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      const tr = r + dr
      const tc = c + dc
      if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
        grid[tr][tc] = type
      }
    }
  }
}

function setBase(grid) {
  grid[13][11] = TILE.BASE
  grid[13][12] = TILE.BASE
  grid[12][11] = TILE.BASE
  grid[12][12] = TILE.BASE
}

function setBaseWall(grid) {
  grid[11][10] = B
  grid[11][11] = B
  grid[11][12] = B
  grid[11][13] = B
  grid[12][10] = B
  grid[13][10] = B
  grid[12][13] = B
  grid[13][13] = B
}

function buildLevel(index) {
  const grid = createEmpty()
  setBase(grid)
  setBaseWall(grid)

  if (index === 0) {
    setBlock(grid, 1, 1, B); setBlock(grid, 1, 3, B); setBlock(grid, 1, 5, B)
    setBlock(grid, 1, 7, B); setBlock(grid, 1, 9, B)
    setBlock(grid, 2, 1, B); setBlock(grid, 2, 5, B); setBlock(grid, 2, 9, B)
    setBlock(grid, 3, 0, B); setBlock(grid, 3, 2, B); setBlock(grid, 3, 3, B)
    setBlock(grid, 3, 4, B); setBlock(grid, 3, 5, B); setBlock(grid, 3, 7, B)
    setBlock(grid, 3, 8, B); setBlock(grid, 3, 9, B)
    setBlock(grid, 4, 1, B); setBlock(grid, 4, 4, B); setBlock(grid, 4, 5, B)
    setBlock(grid, 4, 8, B)
    setBlock(grid, 5, 1, B); setBlock(grid, 5, 2, B); setBlock(grid, 5, 4, B)
    setBlock(grid, 5, 7, B); setBlock(grid, 5, 8, B); setBlock(grid, 5, 9, B)
    setBlock(grid, 6, 2, B); setBlock(grid, 6, 4, B); setBlock(grid, 6, 5, B)
    setBlock(grid, 6, 7, B)
  } else if (index === 1) {
    setBlock(grid, 1, 1, B); setBlock(grid, 1, 3, B); setBlock(grid, 1, 5, B)
    setBlock(grid, 1, 7, B); setBlock(grid, 1, 9, B)
    setBlock(grid, 2, 2, B); setBlock(grid, 2, 4, S); setBlock(grid, 2, 6, B)
    setBlock(grid, 2, 8, S)
    setBlock(grid, 3, 0, B); setBlock(grid, 3, 1, B); setBlock(grid, 3, 3, B)
    setBlock(grid, 3, 5, B); setBlock(grid, 3, 7, B); setBlock(grid, 3, 9, B)
    setBlock(grid, 4, 2, W); setBlock(grid, 4, 3, W); setBlock(grid, 4, 7, W)
    setBlock(grid, 4, 8, W)
    setBlock(grid, 5, 1, B); setBlock(grid, 5, 4, B); setBlock(grid, 5, 5, B)
    setBlock(grid, 5, 6, B); setBlock(grid, 5, 9, B)
    setBlock(grid, 6, 2, B); setBlock(grid, 6, 4, S); setBlock(grid, 6, 5, S)
    setBlock(grid, 6, 7, B)
  } else {
    setBlock(grid, 1, 0, B); setBlock(grid, 1, 2, B); setBlock(grid, 1, 4, B)
    setBlock(grid, 1, 6, B); setBlock(grid, 1, 8, B); setBlock(grid, 1, 10, B)
    setBlock(grid, 2, 1, S); setBlock(grid, 2, 3, B); setBlock(grid, 2, 5, S)
    setBlock(grid, 2, 7, B); setBlock(grid, 2, 9, S)
    setBlock(grid, 3, 0, W); setBlock(grid, 3, 1, W); setBlock(grid, 3, 4, B)
    setBlock(grid, 3, 5, B); setBlock(grid, 3, 8, W); setBlock(grid, 3, 9, W)
    setBlock(grid, 4, 2, B); setBlock(grid, 4, 3, T); setBlock(grid, 4, 4, T)
    setBlock(grid, 4, 5, T); setBlock(grid, 4, 6, T); setBlock(grid, 4, 7, B)
    setBlock(grid, 5, 1, B); setBlock(grid, 5, 3, B); setBlock(grid, 5, 5, S)
    setBlock(grid, 5, 6, S); setBlock(grid, 5, 7, B); setBlock(grid, 5, 9, B)
    setBlock(grid, 6, 2, T); setBlock(grid, 6, 4, B); setBlock(grid, 6, 5, B)
    setBlock(grid, 6, 7, T)
  }

  return grid
}

const LEVELS = [buildLevel(0), buildLevel(1), buildLevel(2)]

const ENEMY_WAVES = [
  [
    { type: 'BASIC', count: 6 },
    { type: 'FAST', count: 2 },
    { type: 'POWER', count: 1 },
    { type: 'ARMOR', count: 1 },
  ],
  [
    { type: 'BASIC', count: 3 },
    { type: 'FAST', count: 3 },
    { type: 'POWER', count: 2 },
    { type: 'ARMOR', count: 2 },
  ],
  [
    { type: 'FAST', count: 3 },
    { type: 'POWER', count: 3 },
    { type: 'ARMOR', count: 4 },
  ],
]

const SPAWN_POINTS = [
  { x: 24, y: 24 },
  { x: 552, y: 24 },
  { x: 288, y: 24 },
]

const PLAYER_SPAWN = { x: 216, y: 600 }

module.exports = { LEVELS, ENEMY_WAVES, SPAWN_POINTS, PLAYER_SPAWN, createEmpty, setBlock }
