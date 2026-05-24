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
  loadAdminData() {
    const app = getApp()
    const adminInfo = app.globalData.userInfo || {}

    this.setData({
      adminInfo: adminInfo
    })

    // TODO: 调用后端接口获取统计数据
    setTimeout(() => {
      this.setData({
        stats: {
          jobCount: 45,
          pendingCount: 12,
          studentCount: 328,
          totalSalary: 15600
        }
      })
    }, 300)
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

  // 添加岗位
  addJob() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 查看全部申请
  viewAllApplications() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 薪资管理
  salaryManage() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 薪资统计
  salaryStats() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 学生管理
  studentManage() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 数据导出
  dataExport() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 系统设置
  systemSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})
