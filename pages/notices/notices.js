// pages/notices/notices.js
const util = require('../../utils/util.js')

Page({
  data: {
    noticeList: [],
    loading: false
  },

  onLoad() { this.loadNotices() },
  onShow() { this.loadNotices() },

  async loadNotices() {
    this.setData({ loading: true })
    try {
      const result = await util.callAdmin('getNotices')
      if (result.code === 200) {
        const list = (result.data.list || []).map(n => ({
          _id: n._id || '',
          title: n.title || '无标题',
          content: n.content || '',
          date: util.formatCloudDate(n.publishDate),
          publisher: n.publisher || ''
        }))
        this.setData({ noticeList: list, loading: false })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载公告失败:', err)
    }
  },

  openDetail(e) {
    const idx = e.currentTarget.dataset.idx
    const n = this.data.noticeList[idx]
    if (!n) return
    wx.showModal({
      title: n.title,
      content: n.content + '\n\n' + n.date + (n.publisher ? ' · ' + n.publisher : ''),
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
