// pages/admin/applicationReview/applicationReview.js
const util = require('../../../utils/util.js')

Page({
  data: {
    activeFilter: 'pending',
    filterOptions: [
      { label: '全部', value: '' },
      { label: '待审核', value: 'pending' },
      { label: '已通过', value: 'approved' },
      { label: '已驳回', value: 'rejected' }
    ],
    applicationList: [],
    sortByTime: true
  },

  onLoad() { this.loadApplicationList() },
  onShow() { this.loadApplicationList() },

  changeFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.filter })
    this.loadApplicationList()
  },

  toggleSort() {
    this.setData({ sortByTime: !this.data.sortByTime })
    this.loadApplicationList()
  },

  async loadApplicationList() {
    util.showLoading('加载中...')
    try {
      const params = { pageNum: 1, pageSize: 100 }
      if (this.data.activeFilter) params.status = this.data.activeFilter
      const result = await util.callApplications('adminList', params)
      util.hideLoading()
      if (result.code === 200) {
        let list = (result.data.list || []).map(item => ({
          ...item,
          applyTime: util.formatCloudDate(item.applyTime),
          reviewTime: util.formatCloudDate(item.reviewTime),
          statusText: util.getApplicationStatusText(item.status)
        }))
        // 时间排序
        if (this.data.sortByTime) {
          list.sort((a, b) => {
            const ta = a.applyTime || ''
            const tb = b.applyTime || ''
            return tb > ta ? 1 : tb < ta ? -1 : 0
          })
        }
        this.setData({ applicationList: list })
      }
    } catch (err) {
      util.hideLoading()
      console.error('加载申请列表失败:', err)
    }
  },

  // 查看学生（跳转学生管理页面）
  viewStudent(e) {
    const studentId = e.currentTarget.dataset.studentid
    wx.navigateTo({
      url: '/pages/admin/studentManage/studentManage?studentId=' + studentId
    })
  },

  // 查看岗位（跳转岗位管理页面）
  viewJob(e) {
    const jobId = e.currentTarget.dataset.jobid
    wx.navigateTo({
      url: '/pages/admin/jobManage/jobManage?jobId=' + jobId
    })
  },

  approveApplication(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认通过',
      content: '确定要通过该申请吗？',
      success: async (res) => {
        if (res.confirm) {
          util.showLoading('审核中...')
          try {
            const result = await util.callApplications('review', { applyId: id, reviewAction: 'approve' })
            util.hideLoading()
            if (result.code === 200) { util.showSuccess('已通过'); this.loadApplicationList() }
          } catch (err) { util.hideLoading(); util.handleCloudError(err, '审核失败') }
        }
      }
    })
  },

  rejectApplication(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '驳回申请',
      content: '请输入驳回原因',
      editable: true,
      placeholderText: '请输入驳回原因',
      success: async (res) => {
        if (res.confirm && res.content) {
          util.showLoading('审核中...')
          try {
            const result = await util.callApplications('review', { applyId: id, reviewAction: 'reject', rejectReason: res.content })
            util.hideLoading()
            if (result.code === 200) { util.showSuccess('已驳回'); this.loadApplicationList() }
          } catch (err) { util.hideLoading(); util.handleCloudError(err, '审核失败') }
        } else if (res.confirm) {
          util.showError('请输入驳回原因')
        }
      }
    })
  }
})
