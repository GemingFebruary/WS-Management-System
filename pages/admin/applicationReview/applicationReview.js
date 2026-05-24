// pages/admin/applicationReview/applicationReview.js
const util = require('../../../utils/util.js')

Page({
  data: {
    activeFilter: 'pending',
    applicationList: []
  },

  onLoad() {
    this.loadApplicationList()
  },

  onShow() {
    this.loadApplicationList()
  },

  // 切换筛选
  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      activeFilter: filter
    })
    this.loadApplicationList()
  },

  // 加载申请列表
  loadApplicationList() {
    util.showLoading('加载中...')

    // TODO: 调用后端接口
    setTimeout(() => {
      util.hideLoading()

      const mockList = [
        {
          applyId: 1,
          studentName: '张三',
          studentId: 'js23080501',
          jobName: '图书馆助理',
          department: '图书馆',
          major: '计算机科学与技术',
          grade: '2023级',
          phone: '13800138001',
          applyTime: '2026-04-15 10:30',
          status: 'pending',
          statusText: '待审核',
          reason: '我想通过勤工助学减轻家庭负担，同时锻炼自己的能力。'
        },
        {
          applyId: 2,
          studentName: '李四',
          studentId: 'js23080502',
          jobName: '实验室助理',
          department: '计算机学院',
          major: '软件工程',
          grade: '2023级',
          phone: '13800138002',
          applyTime: '2026-04-14 14:20',
          status: 'approved',
          statusText: '已通过',
          reviewer: '管理员',
          reviewTime: '2026-04-15 09:00',
          reason: '我有相关实验室工作经验，希望能胜任此岗位。'
        },
        {
          applyId: 3,
          studentName: '王五',
          studentId: 'js23080503',
          jobName: '行政助理',
          department: '学生处',
          major: '工商管理',
          grade: '2024级',
          phone: '13800138003',
          applyTime: '2026-04-13 16:45',
          status: 'rejected',
          statusText: '已驳回',
          reviewer: '管理员',
          reviewTime: '2026-04-14 11:30',
          rejectReason: '专业不符，优先考虑管理类学生',
          reason: '我希望锻炼自己的行政管理能力。'
        }
      ]

      // 根据筛选条件过滤
      let list = mockList
      if (this.data.activeFilter !== 'all') {
        list = mockList.filter(item => item.status === this.data.activeFilter)
      }

      this.setData({
        applicationList: list
      })
    }, 500)
  },

  // 通过申请
  approveApplication(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认通过',
      content: '确定要通过该申请吗？',
      success: (res) => {
        if (res.confirm) {
          util.showSuccess('已通过')
          this.loadApplicationList()
        }
      }
    })
  },

  // 驳回申请
  rejectApplication(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '驳回申请',
      content: '请输入驳回原因',
      editable: true,
      placeholderText: '请输入驳回原因',
      success: (res) => {
        if (res.confirm && res.content) {
          util.showSuccess('已驳回')
          this.loadApplicationList()
        } else if (res.confirm) {
          util.showError('请输入驳回原因')
        }
      }
    })
  }
})
