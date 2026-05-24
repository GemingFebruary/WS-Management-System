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
  loadJobDetail(jobId) {
    util.showLoading('加载中...')

    // TODO: 调用后端接口获取岗位详情
    setTimeout(() => {
      util.hideLoading()

      // 模拟数据
      const mockJob = {
        jobId: jobId,
        jobName: '图书馆助理',
        department: '图书馆',
        jobType: '校内',
        workTime: '周一至周五下午 14:00-17:00',
        salary: 15,
        recruitNum: 10,
        status: 'recruiting',
        statusText: '招聘中',
        publishDate: '2026-04-15',
        matchScore: app.globalData.isLogin ? 85 : 0,
        requirement: '1. 工作认真负责，有良好的服务意识\n2. 熟悉图书馆基本操作流程\n3. 能够熟练使用办公软件\n4. 每周至少工作3个半天\n5. 优先考虑图书管理相关专业学生',
        jobContent: '1. 负责图书上架、整理工作\n2. 协助读者查询图书信息\n3. 维护阅览室秩序\n4. 参与图书盘点工作\n5. 完成老师交办的其他任务',
        requiredMajor: '',
        requiredGrade: '',
        minGpa: 2.5,
        contactPerson: '李老师',
        contactPhone: '010-12345678',
        contactEmail: 'library@university.edu.cn'
      }

      this.setData({
        jobInfo: mockJob
      })

      // 检查是否已申请
      this.checkApplyStatus(jobId)
    }, 500)
  },

  // 检查申请状态
  checkApplyStatus(jobId) {
    if (!app.globalData.isLogin) return

    // TODO: 调用后端接口检查申请状态
    // 这里模拟未申请状态
    this.setData({
      hasApplied: false
    })
  },

  // 处理申请
  handleApply() {
    if (!util.checkLogin()) return

    if (this.data.hasApplied) {
      wx.showToast({
        title: '您已申请过该岗位',
        icon: 'none'
      })
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
