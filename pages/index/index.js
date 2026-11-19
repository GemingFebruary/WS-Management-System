// pages/index/index.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    bannerList: [],
    recommendJobs: [],
    recommendLoading: false,
    recommendError: false,
    noticeList: [],
    allNoticeList: [],
    noticeLoading: false,
    noticeError: false,
    showNoticeDetail: false,
    selectedNotice: null,
    showAllNotices: false,
    initProcessing: false,
    initStepText: ''
  },

  onLoad() {
    this.loadBannerData()
    this.loadNotices()
    this.loadRecommendJobs()
  },

  onShow() {
    this.loadNotices()
    this.loadRecommendJobs()
  },

  // 加载公告列表（首页仅显示前3条）
  async loadNotices() {
    this.setData({ noticeLoading: true, noticeError: false })
    try {
      const result = await util.callAdmin('getNotices')
      if (result.code === 200) {
        const all = (result.data.list || []).map(item => ({
          noticeId: item._id,
          title: item.title,
          content: item.content,
          date: util.formatCloudDate(item.publishDate)
        }))
        this.setData({
          allNoticeList: all,
          noticeList: all.slice(0, 3),
          noticeLoading: false,
          noticeError: all.length === 0
        })
      } else {
        this.setData({ noticeLoading: false, noticeError: true })
      }
    } catch (err) {
      console.error('加载公告失败:', err)
      this.setData({ noticeLoading: false, noticeError: true })
    }
  },

  // 跳转到全部公告页面
  goToNotices() {
    wx.switchTab({ url: '/pages/notices/notices' })
  },

  // 打开公告详情弹窗
  openNotice(e) {
    const noticeId = e.currentTarget.dataset.noticeId
    const notice = this.data.allNoticeList.find(n => n.noticeId === noticeId) ||
                   this.data.noticeList.find(n => n.noticeId === noticeId)
    if (notice) {
      this.setData({ selectedNotice: notice, showNoticeDetail: true })
    }
  },

  // 关闭公告详情弹窗
  closeNotice() {
    this.setData({ showNoticeDetail: false, selectedNotice: null })
  },

  // 加载轮播图数据
  loadBannerData() {
    const bannerList = app.globalData.bannerList || []
    this.setData({ bannerList: bannerList })
  },

  // 加载推荐岗位（限制为4个）
  async loadRecommendJobs() {
    this.setData({ recommendLoading: true, recommendError: false })
    try {
      const result = await util.callJobs('recommend', { pageSize: 4 })
      if (result.code === 200) {
        const jobs = (result.data.list || []).slice(0, 4).map(job => ({
          ...job,
          statusText: util.getJobStatusText(job.status)
        }))
        this.setData({ recommendJobs: jobs, recommendLoading: false, recommendError: jobs.length === 0 })
      } else {
        this.setData({ recommendLoading: false, recommendError: true })
      }
    } catch (err) {
      console.error('加载推荐岗位失败:', err)
      this.setData({ recommendLoading: false, recommendError: true })
    }
  },

  // 跳转到岗位列表
  goToJobList() {
    wx.switchTab({ url: '/pages/jobList/jobList' })
  },

  // 跳转到岗位详情
  goToJobDetail(e) {
    const jobId = e.currentTarget.dataset.jobId
    wx.navigateTo({ url: `/pages/jobDetail/jobDetail?jobId=${jobId}` })
  },

  // 跳转到我的申请
  goToMyApplications() {
    if (!util.checkLogin()) return
    wx.navigateTo({ url: '/pages/myApplications/myApplications' })
  },

  // 跳转到薪资查询
  goToSalaryQuery() {
    if (!util.checkLogin()) return
    wx.navigateTo({ url: '/pages/salaryQuery/salaryQuery' })
  },

  // 跳转到个人中心
  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  },

  // 一键初始化（initDB + seedData 串联执行）
  oneClickInit() {
    wx.showModal({
      title: '一键初始化',
      content: '将创建数据库集合、索引、管理员账号，并生成20个学生、15个岗位、30条申请、40+条薪资记录。确定继续？',
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ initProcessing: true })

        try {
          this.setData({ initStepText: '  步骤1/2：初始化数据库...' })
          const initRes = await this._callInitDB()
          if (initRes.code !== 200) throw new Error(initRes.message || '初始化数据库失败')

          this.setData({ initStepText: '  步骤2/2：生成测试数据...' })
          const seedRes = await this._callSeedData('generate')
          if (seedRes.code !== 200) throw new Error(seedRes.message || '生成测试数据失败')

          const d = seedRes.data || {}
          wx.showModal({
            title: '  初始化完成',
            content: `学生: ${d.students || 0} 人\n岗位: ${d.jobs || 0} 个\n申请: ${d.applications || 0} 条\n薪资: ${d.salaryRecords || 0} 条\n公告: ${d.notices || 0} 条\n\n管理员: admin / admin123\n测试学生: js2380000~js2380019 / 123456`,
            showCancel: false
          })

          this.loadRecommendJobs()
          this.loadNotices()

        } catch (err) {
          console.error('一键初始化失败:', err)
          wx.showModal({ title: '初始化失败', content: err.message || '操作失败', showCancel: false })
        } finally {
          this.setData({ initProcessing: false, initStepText: '' })
        }
      }
    })
  },

  // 仅初始化数据库
  initDatabase() {
    wx.showModal({
      title: '初始化数据库',
      content: '将创建集合、索引和管理员账号（admin/admin123），确定继续？',
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ initProcessing: true, initStepText: '初始化数据库中...' })
        try {
          const result = await this._callInitDB()
          if (result.code === 200) {
            wx.showModal({ title: '初始化成功', content: '数据库集合、索引、管理员账号已创建', showCancel: false })
          } else {
            wx.showToast({ title: result.message || '失败', icon: 'none' })
          }
        } catch (err) {
          wx.showToast({ title: '调用云函数失败', icon: 'none' })
        } finally {
          this.setData({ initProcessing: false, initStepText: '' })
        }
      }
    })
  },

  // 仅生成测试数据
  generateSeedData() {
    wx.showModal({
      title: '生成测试数据',
      content: '将生成 20 学生 + 15 岗位 + 30 申请 + 40+ 薪资记录，确定继续？',
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ initProcessing: true, initStepText: '生成测试数据中...' })
        try {
          const result = await this._callSeedData('generate')
          if (result.code === 200) {
            const d = result.data || {}
            wx.showModal({
              title: '生成成功',
              content: `学生: ${d.students} | 岗位: ${d.jobs}\n申请: ${d.applications} | 薪资: ${d.salaryRecords}\n公告: ${d.notices || 0}`,
              showCancel: false
            })
            this.loadRecommendJobs()
            this.loadNotices()
          } else {
            wx.showToast({ title: result.message || '失败', icon: 'none' })
          }
        } catch (err) {
          wx.showToast({ title: '调用云函数失败', icon: 'none' })
        } finally {
          this.setData({ initProcessing: false, initStepText: '' })
        }
      }
    })
  },

  // 清空测试数据
  clearSeedData() {
    wx.showModal({
      title: '清空测试数据',
      content: '将删除所有测试数据（不影响管理员和初始岗位），确定继续？',
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ initProcessing: true, initStepText: '清空中...' })
        try {
          const result = await this._callSeedData('clear')
          if (result.code === 200) {
            const d = result.data || {}
            wx.showModal({
              title: '清空完成',
              content: `删除学生: ${d.deletedStudents}\n删除岗位: ${d.deletedJobs}\n删除申请: ${d.deletedApplications}\n删除薪资: ${d.deletedSalaryRecords}\n删除公告: ${d.deletedNotices || 0}`,
              showCancel: false
            })
          } else {
            wx.showToast({ title: result.message || '失败', icon: 'none' })
          }
        } catch (err) {
          wx.showToast({ title: '调用云函数失败', icon: 'none' })
        } finally {
          this.setData({ initProcessing: false, initStepText: '' })
        }
      }
    })
  },

  // 内部方法：调用 initDB 云函数
  _callInitDB() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'initDB',
        data: { action: 'init' },
        success: (res) => resolve(res.result || { code: 500, message: '无返回' }),
        fail: (err) => reject(err)
      })
    })
  },

  // 内部方法：调用 seedData 云函数
  _callSeedData(action) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'seedData',
        data: { action },
        success: (res) => resolve(res.result || { code: 500, message: '无返回' }),
        fail: (err) => reject(err)
      })
    })
  }
})
