// pages/admin/admin.js
const util = require('../../utils/util.js')

Page({
  data: {
    adminInfo: {},
    stats: {
      jobCount: 0,
      pendingCount: 0,
      studentCount: 0,
      totalSalary: 0
    }
  },

  onLoad() {
    this.loadAdminData()
  },

  onShow() {
    this.loadAdminData()
  },

  // 加载管理员数据
  async loadAdminData() {
    const app = getApp()
    const adminInfo = app.globalData.userInfo || {}
    this.setData({ adminInfo: adminInfo })

    try {
      const result = await util.callAdmin('stats')
      if (result.code === 200) {
        this.setData({
          stats: {
            jobCount: result.data.jobCount || 0,
            pendingCount: result.data.pendingCount || 0,
            studentCount: result.data.studentCount || 0,
            totalSalary: result.data.totalSalary || 0
          }
        })
      }
    } catch (err) {
      console.error('加载管理员数据失败:', err)
    }
  },

  // 跳转到岗位管理
  goToJobManage() {
    wx.navigateTo({
      url: '/pages/admin/jobManage/jobManage'
    })
  },

  // 跳转到申请审核
  goToApplicationReview() {
    wx.navigateTo({
      url: '/pages/admin/applicationReview/applicationReview'
    })
  },

  // 发布新岗位（独立页面）
  addJob() {
    wx.navigateTo({ url: '/pages/admin/jobEdit/jobEdit' })
  },

  // 查看全部申请
  viewAllApplications() {
    wx.navigateTo({
      url: '/pages/admin/applicationReview/applicationReview'
    })
  },

  // 薪资管理
  salaryManage() {
    wx.navigateTo({
      url: '/pages/admin/salaryManage/salaryManage'
    })
  },

  // 薪资统计
  salaryStats() {
    wx.navigateTo({
      url: '/pages/admin/salaryManage/salaryManage'
    })
  },

  // 学生管理（跳转独立页面）
  studentManage() {
    wx.navigateTo({ url: '/pages/admin/studentManage/studentManage' })
  },

  // 数据导出
  async dataExport() {
    util.showLoading('导出中...')
    try {
      const result = await util.callAdmin('exportData')
      util.hideLoading()
      if (result.code === 200) {
        util.showSuccess('数据导出成功')
      }
    } catch (err) {
      util.hideLoading()
      util.handleCloudError(err, '数据导出失败')
    }
  },

  // 系统设置
  systemSettings() {
    wx.showToast({ title: '系统设置功能即将上线', icon: 'none' })
  },

  // 选项库管理
  optionManage() {
    wx.navigateTo({ url: '/pages/admin/optionManage/optionManage' })
  },

  // 匹配权重配置
  matchSettings() {
    wx.navigateTo({ url: '/pages/admin/matchSettings/matchSettings' })
  },

  // 公告管理
  goToNoticeManage() {
    wx.navigateTo({ url: '/pages/admin/noticeManage/noticeManage' })
  },

  // 发布公告
  goToPublishNotice() {
    wx.navigateTo({ url: '/pages/admin/noticeManage/noticeManage?action=create' })
  }
})
