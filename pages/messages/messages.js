// pages/messages/messages.js
const util = require('../../utils/util.js')
Page({
  data: { list: [], total: 0, unread: 0, pageNum: 1, pageSize: 20, loading: false },
  onShow() { this.loadMessages() },
  async loadMessages() {
    this.setData({ loading: true })
    try {
      const res = await util.callAuth('getMessages', { pageNum: this.data.pageNum, pageSize: this.data.pageSize })
      if (res.code === 200) this.setData({ list: res.data.list || [], total: res.data.total || 0, unread: res.data.unread || 0, loading: false })
      else this.setData({ loading: false })
    } catch (e) { this.setData({ loading: false }); util.showError('加载失败') }
  },
  async onMessageTap(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find(m => m._id === id)
    if (item && !item.read) {
      await util.callAuth('markMessageRead', { messageId: id })
      this.loadMessages()
    }
  },
  async markAll() {
    await util.callAuth('markAllMessagesRead', {})
    util.showSuccess('已全部已读')
    this.loadMessages()
  },
  onPageChange(e) { this.setData({ pageNum: e.detail.pageNum }, () => this.loadMessages()) }
})
