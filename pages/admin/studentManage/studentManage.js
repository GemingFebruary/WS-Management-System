// pages/admin/studentManage/studentManage.js
const util = require('../../../utils/util.js')

Page({
  data: {
    studentList: [],
    loading: false,
    searchKeyword: '',
    pageNum: 1,
    pageSize: 20,
    total: 0
  },

  onLoad(options) {
    this.loadStudents()
    // 从申请审核页面跳转过来时，自动打开编辑
    if (options && options.studentId) {
      this._pendingStudentId = options.studentId
    }
  },

  onShow() {
    this.loadStudents()
  },

  async loadStudents() {
    this.setData({ loading: true })
    try {
      const params = { pageNum: this.data.pageNum, pageSize: this.data.pageSize }
      if (this.data.searchKeyword) params.keyword = this.data.searchKeyword
      const result = await util.callAdmin('studentList', params)
      if (result.code === 200) {
        const list = result.data.list || []
        this.setData({ studentList: list, total: result.data.total || 0, loading: false })
        // 自动打开从申请页面跳转过来的学生
        if (this._pendingStudentId) {
          const id = this._pendingStudentId
          this._pendingStudentId = null
          wx.navigateTo({ url: '/pages/admin/studentEdit/studentEdit?userId=' + id })
        }
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载学生列表失败:', err)
    }
  },

  onSearchInput(e) { this.setData({ searchKeyword: e.detail.value }) },
  onPageChange(e) {
    if (e.detail.pageNum === this.data.pageNum) return
    this.setData({ pageNum: e.detail.pageNum }, () => this.loadStudents())
  },
  doSearch() { this.setData({ pageNum: 1 }, () => this.loadStudents()) },

  // 打开编辑页（独立页面）
  openEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/admin/studentEdit/studentEdit?userId=' + id })
  },


  // 切换状态
  toggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const s = this.data.studentList.find(st => st.userId === id)
    if (!s) return
    const next = s.status === 'active' ? 'disabled' : 'active'
    const label = next === 'active' ? '启用' : '禁用'
    wx.showModal({
      title: '提示',
      content: `确定${label}学生「${s.name}」？`,
      success: async (res) => {
        if (res.confirm) {
          util.showLoading('操作中...')
          try {
            const result = await util.callAdmin('updateStudent', { userId: id, status: next })
            util.hideLoading()
            if (result.code === 200) { util.showSuccess('操作成功'); this.loadStudents() }
          } catch (err) { util.hideLoading(); util.handleCloudError(err, '操作失败') }
        }
      }
    })
  },

  // 重置密码
  resetPassword(e) {
    const id = e.currentTarget.dataset.id
    const s = this.data.studentList.find(st => st.userId === id)
    if (!s) return
    wx.showModal({
      title: '重置密码',
      content: `确定将「${s.name}」的密码重置为学号（${s.studentId}）？`,
      success: async (res) => {
        if (res.confirm) {
          util.showLoading('重置中...')
          try {
            const result = await util.callAdmin('updateStudent', { userId: id, password: s.studentId })
            util.hideLoading()
            if (result.code === 200) util.showSuccess('密码已重置为学号')
          } catch (err) { util.hideLoading(); util.handleCloudError(err, '重置失败') }
        }
      }
    })
  },

  // 设为管理员
  setRole(e) {
    const id = e.currentTarget.dataset.id
    const s = this.data.studentList.find(st => st.userId === id)
    if (!s) return
    wx.showModal({
      title: '设为管理员',
      content: `确定将「${s.name}」设为管理员？`,
      success: async (res) => {
        if (!res.confirm) return
        util.showLoading('处理中...')
        try {
          const result = await util.callAdmin('setUserRole', { userId: id, role: 'admin' })
          util.hideLoading()
          if (result.code === 200) { util.showSuccess('已设为管理员'); this.loadStudents() }
          else util.showError(result.message || '操作失败')
        } catch (err) { util.hideLoading(); util.handleCloudError(err, '操作失败') }
      }
    })
  }
})
