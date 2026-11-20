// components/bottom-panel/bottom-panel.js
Component({
  options: { multipleSlots: true },
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    confirmText: { type: String, value: '确定' },
    showFooter: { type: Boolean, value: true },
    closeOnClickOverlay: { type: Boolean, value: true }
  },
  methods: {
    onOverlay() { if (this.data.closeOnClickOverlay) this.triggerEvent('close') },
    onClose() { this.triggerEvent('close') },
    onConfirm() { this.triggerEvent('confirm') }
  }
})
