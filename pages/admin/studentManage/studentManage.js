// pages/admin/studentManage/studentManage.js
const util = require('../../../utils/util.js')

Page({
  data: {
    studentList: [],
    loading: false,
    searchKeyword: '',
    // 编辑弹窗
    showEditModal: false,
    editTargetId: '',
    editForm: {
      name: '', gender: '', college: '', major: '', grade: '',
      phone: '', email: '', gpa: 0, familyType: '', familyDesc: '', status: 'active'
    }
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
      const params = { pageNum: 1, pageSize: 100 }
      if (this.data.searchKeyword) params.keyword = this.data.searchKeyword
      const result = await util.callAdmin('studentList', params)
      if (result.code === 200) {
        const list = result.data.list || []
        this.setData({ studentList: list, loading: false })
        // 自动打开从申请页面跳转过来的学生
        if (this._pendingStudentId) {
          const target = list.find(s => s.studentId === this._pendingStudentId || s.userId === this._pendingStudentId)
          if (target) this.openEdit({ currentTarget: { dataset: { id: target.userId } } })
          this._pendingStudentId = null
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
  doSearch() { this.loadStudents() },

  // 打开编辑弹窗
  openEdit(e) {
    const id = e.currentTarget.dataset.id
    const s = this.data.studentList.find(st => st.userId === id)
    if (!s) return
    this.setData({
      showEditModal: true,
      editTargetId: s.userId || '',
      editForm: {
        name: s.name || '', gender: s.gender || '', college: s.college || '',
        major: s.major || '', grade: s.grade || '', phone: s.phone || '',
        email: s.email || '', gpa: s.gpa || 0, familyType: s.familyType || '',
        familyDesc: s.familyDesc || '', status: s.status || 'active'
      }
    })
  },

  onEditField(e) {
    const field = e.currentTarget.dataset.field
    let value = e.detail.value
    // picker 返回索引，需要映射为实际值
    const pickerMap = {
      gender: ['男', '女'],
      familyType: ['一般', '困难', '特别困难'],
      status: ['active', 'disabled']
    }
    if (pickerMap[field]) {
      value = pickerMap[field][e.detail.value] || value
    }
    this.setData({ [`editForm.${field}`]: value })
  },

  onEditNumberField(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`editForm.${field}`]: Number(e.detail.value) || 0 })
  },

  closeEditModal() { this.setData({ showEditModal: false }) },

  async saveEdit() {
    util.showLoading('保存中...')
    try {
      const result = await util.callAdmin('updateStudent', {
        userId: this.data.editTargetId,
        ...this.data.editForm
      })
      util.hideLoading()
      if (result.code === 200) {
        util.showSuccess('保存成功')
        this.setData({ showEditModal: false })
        this.loadStudents()
      }
    } catch (err) {
      util.hideLoading()
      util.handleCloudError(err, '更新失败')
    }
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
  }
})
