// pages/login/login.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    account: '',
    password: '',
    userRole: 'student' // student 或 admin
  },

  onLoad() {
    // 如果已登录，直接跳转到首页
    if (app.globalData.isLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 账号输入
  onAccountInput(e) {
    this.setData({
      account: e.detail.value
    })
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 选择角色
  selectRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({
      userRole: role
    })
  },

  // 处理登录
  async handleLogin() {
    const { account, password, userRole } = this.data

    // 表单验证
    if (!account) {
      util.showError('请输入账号')
      return
    }
    if (!password) {
      util.showError('请输入密码')
      return
    }

    util.showLoading('登录中...')

    try {
      // 直接发送明文密码，由云函数端使用bcrypt进行加密比对
      // 密码安全由服务端保障，不在前端做加密处理
      const result = await wx.cloud.callFunction({
        name: 'auth',
        data: {
          action: 'login',
          account,
          password: password,
          role: userRole
        }
      })

      util.hideLoading()

      if (result.result.code === 200) {
        const { token, userInfo } = result.result.data

        // 保存用户信息和token（添加过期时间）
        const tokenData = {
          token: token,
          expireTime: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
        }
        wx.setStorageSync('userInfo', userInfo)
        wx.setStorageSync('tokenData', tokenData)

        // 更新全局状态
        app.globalData.userInfo = userInfo
        app.globalData.isLogin = true
        app.globalData.userRole = userRole

        util.showSuccess('登录成功')

        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        util.showError(result.result.message || '登录失败')
      }
    } catch (err) {
      util.hideLoading()
      // 使用统一的错误处理
      util.handleCloudError(err, '登录失败')
    }
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  }
})
