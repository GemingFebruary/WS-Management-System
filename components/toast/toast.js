// components/toast/toast.js
Component({
  properties: {
    show: { type: Boolean, value: false },
    message: { type: String, value: '' },
    type: { type: String, value: 'info' },
    duration: { type: Number, value: 2000 }
  },
  observers: {
    show(v) {
      if (v && this.data.duration > 0) {
        clearTimeout(this._timer)
        this._timer = setTimeout(() => {
          this.setData({ show: false })
          this.triggerEvent('close')
        }, this.data.duration)
      }
    }
  }
})
