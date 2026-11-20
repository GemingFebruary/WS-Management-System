// pages/jobDetail/jobDetail.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    jobId: null,
    jobInfo: {},
    hasApplied: false
  },

  onLoad(options) {
    const jobId = options.jobId
    this.setData({
      jobId: jobId
    })
    this.loadJobDetail(jobId)
  },

  // 加载岗位详情
  async loadJobDetail(jobId) {
    util.showLoading('加载中...')
    try {
      const result = await util.callJobs('detail', { jobId: jobId })
      util.hideLoading()
      if (result.code === 200) {
        this.setData({
          jobInfo: {
            ...result.data,
            publishDate: util.formatCloudDate(result.data.publishDate),
            statusText: util.getJobStatusText(result.data.status)
          }
        })
      }
      // 检查是否已申请
      this.checkApplyStatus(jobId)
    } catch (err) {
      util.hideLoading()
      console.error('加载岗位详情失败:', err)
    }
  },

  // 检查申请状态
  async checkApplyStatus(jobId) {
    if (!app.globalData.isLogin) return
    try {
      const result = await util.callApplications('myApplications', { jobId: jobId, pageSize: 1 })
      if (result.code === 200) {
        const list = result.data.list || []
        const hasApplied = list.some(item => String(item.jobId) === String(jobId))
        this.setData({ hasApplied: hasApplied })
      }
    } catch (err) {
      console.error('检查申请状态失败:', err)
    }
  },

  // 处理申请
  handleApply() {
    if (!util.checkLogin()) return

    if (this.data.hasApplied) {
      util.showToast('您已申请过该岗位', 'info')
      return
    }

    wx.showModal({
      title: '确认申请',
      content: `确定要申请"${this.data.jobInfo.jobName}"岗位吗？`,
      success: (res) => {
        if (res.confirm) {
          // 跳转到申请页面
          wx.navigateTo({
            url: `/pages/applyJob/applyJob?jobId=${this.data.jobId}`
          })
        }
      }
    })
  }
})
