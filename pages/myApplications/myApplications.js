// pages/myApplications/myApplications.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    activeStatus: 'all',
    applicationList: [],
    loading: false,
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    total: 0
  },

  onLoad() {
    this.loadApplicationList()
  },

  onShow() {
    // 刷新列表
    this.setData({
      pageNum: 1,
      hasMore: true,
      applicationList: []
    })
    this.loadApplicationList()
  },

  // 切换状态筛选
  changeStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      activeStatus: status,
      pageNum: 1,
      hasMore: true,
      applicationList: []
    })
    this.loadApplicationList()
  },

  // 加载申请列表
  async loadApplicationList() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      // 检查登录状态
      if (!app.globalData.isLogin) {
        wx.showModal({
          title: '提示',
          content: '请先登录',
          showCancel: false,
          success: () => {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        })
        this.setData({ loading: false })
        return
      }

      // 调用云函数获取申请列表
      const params = {
        action: 'myApplications',
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize
      }

      if (this.data.activeStatus !== 'all') {
        params.status = this.data.activeStatus
      }

      const result = await wx.cloud.callFunction({
        name: 'applications',
        data: params
      })

      if (result.result.code === 200) {
        const { total, list } = result.result.data

        let applicationList = []
        if (this.data.pageNum === 1) {
          applicationList = list
        } else {
          applicationList = [...this.data.applicationList, ...list]
        }

        this.setData({
          applicationList: applicationList,
          total: total,
          loading: false,
          hasMore: applicationList.length < total,
          pageNum: this.data.pageNum + 1
        })
      } else {
        this.setData({ loading: false })
        util.showError(result.result.message || '加载失败')
      }
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载申请列表失败:', err)
      util.showError('加载失败，请检查网络连接')
    }
  },

  // 查看详情
  viewDetail(e) {
    const applyId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/applicationDetail/applicationDetail?applyId=${applyId}`
    })
  },

  // 查看薪资
  viewSalary(e) {
    const jobId = e.currentTarget.dataset.jobId
    wx.navigateTo({
      url: `/pages/salaryQuery/salaryQuery?jobId=${jobId}`
    })
  },

  // 跳转到岗位列表
  goToJobList() {
    wx.switchTab({
      url: '/pages/jobList/jobList'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hasMore: true,
      applicationList: []
    })
    this.loadApplicationList()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadApplicationList()
  }
})
