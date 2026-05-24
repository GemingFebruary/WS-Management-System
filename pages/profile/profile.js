// pages/profile/profile.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    isLogin: false,
    userRole: 'student',
    userInfo: {},
    applyCount: 0,
    successCount: 0,
    totalSalary: 0
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLogin = app.globalData.isLogin
    const userInfo = app.globalData.userInfo || {}
    const userRole = app.globalData.userRole || 'student'

    this.setData({
      isLogin: isLogin,
      userInfo: userInfo,
      userRole: userRole
    })

    if (isLogin) {
      this.loadUserStats()
    }
  },

  // 加载用户统计数据
  loadUserStats() {
    // TODO: 调用后端接口获取用户统计
    // 这里使用模拟数据
    this.setData({
      applyCount: 5,
      successCount: 2,
      totalSalary: 1200
    })
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 跳转到我的申请
  goToMyApplications() {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '/pages/myApplications/myApplications'
    })
  },

  // 跳转到薪资查询
  goToSalaryQuery() {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '/pages/salaryQuery/salaryQuery'
    })
  },

  // 跳转到岗位列表
  goToJobList() {
    wx.switchTab({
      url: '/pages/jobList/jobList'
    })
  },

  // 编辑资料
  editProfile() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 修改密码
  changePassword() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 联系我们
  contactUs() {
    wx.showModal({
      title: '联系我们',
      content: '勤工助学管理中心\n电话：010-12345678\n邮箱：qgzx@university.edu.cn',
      showCancel: false
    })
  },

  // 跳转到管理后台
  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('token')

          // 更新全局状态
          app.globalData.userInfo = null
          app.globalData.isLogin = false
          app.globalData.userRole = 'student'

          util.showSuccess('已退出登录')

          // 刷新页面
          this.checkLoginStatus()
        }
      }
    })
  }
})
