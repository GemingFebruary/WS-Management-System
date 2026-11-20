// pages/admin/jobManage/jobManage.js
const util = require('../../../utils/util.js')

Page({
  data: {
    jobList: [],
    loading: false,
    searchKeyword: '',
    statusFilter: '',
    statusOptions: [
      { label: '全部状态', value: '' },
      { label: '招聘中', value: 'recruiting' },
      { label: '已满员', value: 'full' },
      { label: '已关闭', value: 'closed' }
    ],
    statusFilterIndex: 0
  },

  onLoad(options) {
    this.loadJobList()
    // 从申请页面跳转过来时自动打开对应岗位的编辑页
    if (options && options.jobId) {
      this._pendingJobId = options.jobId
    }
  },

  onShow() {
    this.loadJobList()
  },

  // 加载岗位列表
  async loadJobList() {
    this.setData({ loading: true })
    try {
      const params = { pageNum: 1, pageSize: 100 }
      if (this.data.searchKeyword) params.keyword = this.data.searchKeyword
      if (this.data.statusFilter) params.status = this.data.statusFilter
      const result = await util.callJobs('list', params)
      if (result.code === 200) {
        const jobs = (result.data.list || []).map(job => ({
          ...job,
          statusText: util.getJobStatusText(job.status)
        }))
        this.setData({ jobList: jobs, loading: false })
        // 自动打开从申请页面跳转过来的岗位
        if (this._pendingJobId) {
          const id = this._pendingJobId
          this._pendingJobId = null
          wx.navigateTo({ url: '/pages/admin/jobEdit/jobEdit?jobId=' + id })
        }
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载岗位列表失败:', err)
    }
  },

  onSearchInput(e) { this.setData({ searchKeyword: e.detail.value }) },
  doSearch() { this.loadJobList() },

  onStatusFilterChange(e) {
    const idx = e.detail.value
    this.setData({ statusFilterIndex: idx, statusFilter: this.data.statusOptions[idx].value })
    this.loadJobList()
  },

  // 打开发布页（独立页面）
  openCreate() {
    wx.navigateTo({ url: '/pages/admin/jobEdit/jobEdit' })
  },

  // 打开编辑页（独立页面）
  openEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/admin/jobEdit/jobEdit?jobId=' + id })
  },


  // 切换状态（三状态）— picker 返回索引
  changeStatus(e) {
    const id = e.currentTarget.dataset.id
    const statusMap = ['recruiting', 'full', 'closed']
    const newStatus = statusMap[e.detail.value]
    const job = this.data.jobList.find(j => j.jobId === id || j._id === id)
    if (!job || job.status === newStatus) return
    const label = { recruiting: '招聘中', full: '已满员', closed: '已关闭' }
    wx.showModal({
      title: '切换状态',
      content: `将「${job.jobName}」状态改为「${label[newStatus]}」？`,
      success: async (res) => {
        if (res.confirm) {
          util.showLoading('操作中...')
          try {
            const result = await util.callJobs('toggleStatus', { jobId: id, status: newStatus })
            util.hideLoading()
            if (result.code === 200) { util.showSuccess('操作成功'); this.loadJobList() }
          } catch (err) { util.hideLoading(); util.handleCloudError(err, '操作失败') }
        }
      }
    })
  },

  // 删除岗位
  deleteJob(e) {
    const id = e.currentTarget.dataset.id
    const job = this.data.jobList.find(j => j.jobId === id || j._id === id)
    wx.showModal({
      title: '确认删除',
      content: `确定要删除岗位「${job ? job.jobName : ''}」吗？此操作不可恢复。`,
      success: async (res) => {
        if (res.confirm) {
          util.showLoading('删除中...')
          try {
            const result = await util.callJobs('delete', { jobId: id })
            util.hideLoading()
            if (result.code === 200) { util.showSuccess('删除成功'); this.loadJobList() }
          } catch (err) { util.hideLoading(); util.handleCloudError(err, '删除失败') }
        }
      }
    })
  }
})
