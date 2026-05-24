// pages/admin/jobManage/jobManage.js
const util = require('../../../utils/util.js')

Page({
  data: {
    jobList: []
  },

  onLoad() {
    this.loadJobList()
  },

  onShow() {
    this.loadJobList()
  },

  // 加载岗位列表
  loadJobList() {
    util.showLoading('加载中...')

    // TODO: 调用后端接口
    setTimeout(() => {
      util.hideLoading()

      this.setData({
        jobList: [
          {
            jobId: 1,
            jobName: '图书馆助理',
            department: '图书馆',
            recruitNum: 10,
            salary: 15,
            status: 'recruiting',
            statusText: '招聘中'
          },
          {
            jobId: 2,
            jobName: '实验室助理',
            department: '计算机学院',
            recruitNum: 5,
            salary: 20,
            status: 'recruiting',
            statusText: '招聘中'
          },
          {
            jobId: 3,
            jobName: '行政助理',
            department: '学生处',
            recruitNum: 8,
            salary: 18,
            status: 'closed',
            statusText: '已关闭'
          }
        ]
      })
    }, 500)
  },

  // 添加岗位
  addJob() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 编辑岗位
  editJob(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 切换状态
  toggleStatus(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要切换该岗位的招聘状态吗？',
      success: (res) => {
        if (res.confirm) {
          util.showSuccess('操作成功')
          this.loadJobList()
        }
      }
    })
  },

  // 删除岗位
  deleteJob(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要删除该岗位吗？',
      success: (res) => {
        if (res.confirm) {
          util.showSuccess('删除成功')
          this.loadJobList()
        }
      }
    })
  }
})
