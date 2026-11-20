// components/modal/modal.js
Component({
  options: { multipleSlots: true },
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    showCancel: { type: Boolean, value: true },
    confirmText: { type: String, value: '确定' },
    cancelText: { type: String, value: '取消' },
    closeOnClickOverlay: { type: Boolean, value: false }
  },
  methods: {
    onOverlay() {
      if (this.data.closeOnClickOverlay) this.triggerEvent('close')
    },
    onClose() { this.triggerEvent('close') },
    onCancel() { this.triggerEvent('cancel') },
    onConfirm() { this.triggerEvent('confirm') }
  }
})
