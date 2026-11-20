// components/empty-state/empty-state.js
Component({
  options: { multipleSlots: true },
  properties: {
    show: { type: Boolean, value: true },
    icon: { type: String, value: '/images/icon/empty-box.png' },
    text: { type: String, value: '暂无数据' }
  }
})
