class Explosion {
  constructor(x, y, big) {
    this.x = x
    this.y = y
    this.big = big || false
    this.time = 0
    this.duration = big ? 500 : 300
    this.alive = true
  }

  update(dt) {
    this.time += dt
    if (this.time >= this.duration) this.alive = false
  }

  draw(ctx) {
    if (!this.alive) return
    const progress = this.time / this.duration
    const maxR = this.big ? 40 : 20
    let r, alpha
    if (progress < 0.3) {
      r = maxR * (progress / 0.3)
      alpha = 1
    } else if (progress < 0.6) {
      r = maxR
      alpha = 1
    } else {
      r = maxR
      alpha = 1 - (progress - 0.6) / 0.4
    }

    ctx.save()
    ctx.globalAlpha = alpha

    ctx.fillStyle = '#FF4400'
    ctx.beginPath()
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFAA00'
    ctx.beginPath()
    ctx.arc(this.x, this.y, r * 0.7, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFEE88'
    ctx.beginPath()
    ctx.arc(this.x, this.y, r * 0.35, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

class ScorePopup {
  constructor(x, y, score) {
    this.x = x
    this.y = y
    this.score = score
    this.time = 0
    this.duration = 800
    this.alive = true
  }

  update(dt) {
    this.time += dt
    this.y -= 0.5
    if (this.time >= this.duration) this.alive = false
  }

  draw(ctx) {
    if (!this.alive) return
    const alpha = 1 - this.time / this.duration
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.score.toString(), this.x, this.y)
    ctx.restore()
  }
}

module.exports = { Explosion, ScorePopup }
