// pages/admin/noticeManage/noticeManage.js
const util = require('../../../utils/util.js')

Page({
  data: {
    noticeList: [],
    loading: false,
    // 编辑弹窗
    showEditModal: false,
    isEdit: false,
    editForm: { noticeId: '', title: '', content: '' }
  },

  onLoad(options) {
    this.loadNotices()
    if (options && options.action === 'create') this.openCreate()
  },

  onShow() {
    this.loadNotices()
  },

  async loadNotices() {
    this.setData({ loading: true })
    try {
      const result = await util.callAdmin('getNotices')
      if (result.code === 200) {
        const list = (result.data.list || []).map(n => ({
          ...n,
          publishDateText: util.formatCloudDate(n.publishDate)
        }))
        this.setData({ noticeList: list, loading: false })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载公告列表失败:', err)
    }
  },

  openCreate() {
    this.setData({
      isEdit: false, showEditModal: true,
      editForm: { noticeId: '', title: '', content: '' }
    })
  },

  openEdit(e) {
    const idx = e.currentTarget.dataset.idx
    const notice = this.data.noticeList[idx]
    if (!notice) return
    this.setData({
      isEdit: true, showEditModal: true,
      editForm: {
        noticeId: notice._id || '',
        title: notice.title || '',
        content: notice.content || ''
      }
    })
  },

  onTitleInput(e) { this.setData({ 'editForm.title': e.detail.value }) },
  onContentInput(e) { this.setData({ 'editForm.content': e.detail.value }) },
  closeEditModal() { this.setData({ showEditModal: false }) },

  async submitNotice() {
    const f = this.data.editForm
    if (!f.title.trim() || !f.content.trim()) {
      util.showError('请填写标题和内容')
      return
    }
    util.showLoading(this.data.isEdit ? '保存中...' : '发布中...')
    try {
      let result
      if (this.data.isEdit) {
        result = await util.callAdmin('updateNotice', { noticeId: f.noticeId, title: f.title, content: f.content })
      } else {
        result = await util.callAdmin('publishNotice', { title: f.title, content: f.content })
      }
      util.hideLoading()
      if (result.code === 200) {
        util.showSuccess(this.data.isEdit ? '保存成功' : '发布成功')
        this.setData({ showEditModal: false })
        this.loadNotices()
      }
    } catch (err) {
      util.hideLoading()
      util.handleCloudError(err, '操作失败')
    }
  },

  deleteNotice(e) {
    const idx = e.currentTarget.dataset.idx
    const notice = this.data.noticeList[idx]
    if (!notice) return
    wx.showModal({
      title: '确认删除',
      content: `确定要删除公告「${notice.title}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          util.showLoading('删除中...')
          try {
            const result = await util.callAdmin('deleteNotice', { noticeId: notice._id })
            util.hideLoading()
            if (result.code === 200) { util.showSuccess('删除成功'); this.loadNotices() }
          } catch (err) { util.hideLoading(); util.handleCloudError(err, '删除失败') }
        }
      }
    })
  }
})
