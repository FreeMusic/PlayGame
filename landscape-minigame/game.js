const Game = require('./js/game')

const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')

const game = new Game(canvas, ctx)

let lastTime = Date.now()

function loop() {
  const now = Date.now()
  const dt = Math.min(now - lastTime, 50)
  lastTime = now

  game.update(dt)
  game.draw()
  requestAnimationFrame(loop)
}

loop()
