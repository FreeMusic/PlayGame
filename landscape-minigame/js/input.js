const C = {
  UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3,
}

class Input {
  constructor(canvas) {
    this.canvas = canvas
    this.dir = -1
    this.firing = false
    this.tapX = -1
    this.tapY = -1
    this.tapped = false
    this.activeId = -1
    this.fireId = -1

    this.padCX = 130
    this.padCY = 540
    this.padR = 100
    this.padInner = 40
    this.fireCX = 1150
    this.fireCY = 520
    this.fireR = 60

    wx.onTouchStart(this._onStart.bind(this))
    wx.onTouchMove(this._onMove.bind(this))
    wx.onTouchEnd(this._onEnd.bind(this))
    wx.onTouchCancel(this._onEnd.bind(this))
  }

  _onStart(e) {
    for (const t of e.touches) {
      const x = t.clientX
      const y = t.clientY
      const dx = x - this.fireCX
      const dy = y - this.fireCY
      if (dx * dx + dy * dy < this.fireR * this.fireR * 1.5) {
        this.fireId = t.identifier
        this.firing = true
        continue
      }
      const pdx = x - this.padCX
      const pdy = y - this.padCY
      if (pdx * pdx + pdy * pdy < this.padR * this.padR * 2) {
        this.activeId = t.identifier
        this._updateDir(x, y)
        continue
      }
      this.tapX = x
      this.tapY = y
      this.tapped = true
    }
  }

  _onMove(e) {
    for (const t of e.touches) {
      if (t.identifier === this.activeId) {
        this._updateDir(t.clientX, t.clientY)
      }
    }
  }

  _onEnd(e) {
    let padActive = false
    let fireActive = false
    for (const t of e.touches) {
      if (t.identifier === this.activeId) padActive = true
      if (t.identifier === this.fireId) fireActive = true
    }
    if (!padActive) {
      this.activeId = -1
      this.dir = -1
    }
    if (!fireActive) {
      this.fireId = -1
      this.firing = false
    }
  }

  _updateDir(x, y) {
    const dx = x - this.padCX
    const dy = y - this.padCY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 15) {
      this.dir = -1
      return
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dir = dx > 0 ? C.RIGHT : C.LEFT
    } else {
      this.dir = dy > 0 ? C.DOWN : C.UP
    }
  }

  consumeTap() {
    if (this.tapped) {
      this.tapped = false
      return { x: this.tapX, y: this.tapY }
    }
    return null
  }
}

module.exports = { Input, C }
