// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d7g94p70f23bf5769',
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
    baseUrl: 'http://localhost:5000/api', // 后端API地址
    // 轮播图配置
    bannerList: [
      {
        id: 1,
        imageUrl: 'https://picsum.photos/seed/qg1/750/360',
        title: '勤工助学，助力成长'
      },
      {
        id: 2,
        imageUrl: 'https://picsum.photos/seed/qg2/750/360',
        title: '丰富岗位任你选'
      },
      {
        id: 3,
        imageUrl: 'https://picsum.photos/seed/qg3/750/360',
        title: '智能匹配，快速上岗'
      }
    ]
  }
})
