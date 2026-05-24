// pages/index/index.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    bannerList: [],
    recommendJobs: [],
    noticeList: [
      {
        noticeId: 1,
        content: '2026年春季勤工助学岗位开始申请',
        date: '2026-04-15'
      },
      {
        noticeId: 2,
        content: '图书馆助理岗位新增20个名额',
        date: '2026-04-14'
      },
      {
        noticeId: 3,
        content: '关于规范勤工助学薪资发放的通知',
        date: '2026-04-10'
      }
    ]
  },

  onLoad() {
    this.loadBannerData()
    this.loadRecommendJobs()
    
    // 开发阶段：自动初始化数据库（可选）
    // this.initDatabase()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadRecommendJobs()
  },

  // 加载轮播图数据
  loadBannerData() {
    const bannerList = app.globalData.bannerList || []
    this.setData({
      bannerList: bannerList
    })
  },

  // 加载推荐岗位
  loadRecommendJobs() {
    util.showLoading('加载中...')
    
    // TODO: 调用后端接口获取推荐岗位
    // 这里使用模拟数据
    setTimeout(() => {
      const mockJobs = [
        {
          jobId: 1,
          jobName: '图书馆助理',
          department: '图书馆',
          jobType: '校内',
          workTime: '周一至周五下午',
          salary: 15,
          recruitNum: 10,
          status: 'recruiting',
          statusText: '招聘中',
          matchScore: 85
        },
        {
          jobId: 2,
          jobName: '实验室助理',
          department: '计算机学院',
          jobType: '校内',
          workTime: '周末',
          salary: 20,
          recruitNum: 5,
          status: 'recruiting',
          statusText: '招聘中',
          matchScore: 78
        },
        {
          jobId: 3,
          jobName: '行政助理',
          department: '学生处',
          jobType: '校内',
          workTime: '课余时间',
          salary: 18,
          recruitNum: 8,
          status: 'recruiting',
          statusText: '招聘中',
          matchScore: 72
        }
      ]
      
      util.hideLoading()
      this.setData({
        recommendJobs: mockJobs
      })
    }, 500)
  },

  // 跳转到岗位列表
  goToJobList() {
    wx.switchTab({
      url: '/pages/jobList/jobList'
    })
  },

  // 跳转到岗位详情
  goToJobDetail(e) {
    const jobId = e.currentTarget.dataset.jobId
    wx.navigateTo({
      url: `/pages/jobDetail/jobDetail?jobId=${jobId}`
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

  // 跳转到个人中心
  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  // 初始化数据库（开发阶段使用）
  initDatabase() {
    console.log('开始初始化数据库...')
    
    wx.showModal({
      title: '初始化数据库',
      content: '这将创建数据库集合和示例数据，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          util.showLoading('初始化中...')
          
          wx.cloud.callFunction({
            name: 'initDB',
            data: { action: 'init' }
          }).then(result => {
            util.hideLoading()
            console.log('初始化结果:', result.result)
            
            if (result.result.code === 200) {
              wx.showModal({
                title: '初始化成功',
                content: JSON.stringify(result.result.data, null, 2),
                showCancel: false
              })
            } else {
              wx.showToast({
                title: '初始化失败: ' + result.result.message,
                icon: 'none'
              })
            }
          }).catch(err => {
            util.hideLoading()
            console.error('初始化失败:', err)
            wx.showToast({
              title: '调用云函数失败',
              icon: 'none'
            })
          })
        }
      }
    })
  }
})
