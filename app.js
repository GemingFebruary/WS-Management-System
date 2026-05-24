// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-cloud-env-id',
        traceUser: true
      })
      console.log('云开发初始化成功')
    }

    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLogin = true
      this.globalData.userRole = userInfo.role || 'student'
    } else {
      this.globalData.isLogin = false
    }
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLogin: false,
    userRole: 'student', // student 或 admin
    baseUrl: 'https://your-api-domain.com/api', // 后端API地址
    // 轮播图配置 - 预留图片URL
    bannerList: [
      {
        id: 1,
        imageUrl: 'https://example.com/banner1.jpg', // 轮播图1 URL
        title: '勤工助学，助力成长'
      },
      {
        id: 2,
        imageUrl: 'https://example.com/banner2.jpg', // 轮播图2 URL
        title: '丰富岗位任你选'
      },
      {
        id: 3,
        imageUrl: 'https://example.com/banner3.jpg', // 轮播图3 URL
        title: '智能匹配，快速上岗'
      }
    ]
  }
})
