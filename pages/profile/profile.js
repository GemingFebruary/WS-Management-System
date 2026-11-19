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
  async loadUserStats() {
    try {
      // 获取申请统计
      const appResult = await util.callApplications('myApplications', { pageNum: 1, pageSize: 1 })
      if (appResult.code === 200) {
        this.setData({ applyCount: appResult.data.total || 0 })
      }
      // 获取薪资统计
      const salaryResult = await util.callSalary('query')
      if (salaryResult.code === 200) {
        this.setData({
          totalSalary: salaryResult.data.totalSalary || 0,
          successCount: salaryResult.data.currentJobCount || 0
        })
      }
    } catch (err) {
      console.error('加载用户统计失败:', err)
    }
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
    const userInfo = this.data.userInfo || {}
    wx.showModal({
      title: '编辑资料',
      editable: true,
      placeholderText: '请输入新的姓名',
      content: userInfo.name || '',
      success: (res) => {
        if (res.confirm && res.content) {
          const newName = res.content.trim()
          if (!newName) {
            util.showError('姓名不能为空')
            return
          }
          util.showLoading('保存中...')
          util.callAuth('updateProfile', { name: newName }).then(result => {
            util.hideLoading()
            if (result.code === 200) {
              app.globalData.userInfo.name = newName
              this.setData({ 'userInfo.name': newName })
              util.showSuccess('保存成功')
            }
          }).catch(err => {
            util.hideLoading()
            util.handleCloudError(err, '保存失败')
          })
        }
      }
    })
  },

  // 修改密码
  changePassword() {
    let oldPassword = ''
    wx.showModal({
      title: '修改密码',
      editable: true,
      placeholderText: '请输入旧密码',
      content: '',
      success: (res1) => {
        if (!res1.confirm || !res1.content) return
        oldPassword = res1.content.trim()
        if (!util.isValidPassword(oldPassword)) {
          util.showError('旧密码长度需为6-20位')
          return
        }
        wx.showModal({
          title: '修改密码',
          editable: true,
          placeholderText: '请输入新密码',
          content: '',
          success: (res2) => {
            if (!res2.confirm || !res2.content) return
            const newPassword = res2.content.trim()
            if (!util.isValidPassword(newPassword)) {
              util.showError('新密码长度需为6-20位')
              return
            }
            if (oldPassword === newPassword) {
              util.showError('新密码不能与旧密码相同')
              return
            }
            util.showLoading('修改中...')
            util.callAuth('changePassword', {
              oldPassword: oldPassword,
              newPassword: newPassword
            }).then(result => {
              util.hideLoading()
              if (result.code === 200) {
                util.showSuccess('密码修改成功')
              }
            }).catch(err => {
              util.hideLoading()
              util.handleCloudError(err, '修改密码失败')
            })
          }
        })
      }
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

  // 查看公告（跳转到公告TabBar页）
  viewNotices() {
    wx.switchTab({ url: '/pages/notices/notices' })
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
