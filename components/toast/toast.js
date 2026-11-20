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
  },
  methods: {
    // 供全局调度调用
    show(message, type = 'info', duration = 2000) {
      this.setData({ show: true, message: String(message), type, duration })
    },
    hide() {
      clearTimeout(this._timer)
      this.setData({ show: false })
    }
  }
})
