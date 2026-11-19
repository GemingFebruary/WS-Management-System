// pages/salaryQuery/salaryQuery.js
const util = require('../../utils/util.js')

Page({
  data: {
    totalSalary: 0,
    monthSalary: 0,
    totalHours: 0,
    currentJobCount: 0,
    monthOptions: [],
    monthIndex: 0,
    currentMonth: '',
    monthData: {
      shouldPay: 0,
      actualPay: 0,
      workHours: 0,
      payStatus: 'paid',
      payStatusText: '已发放'
    },
    salaryDetailList: []
  },

  onLoad(options) {
    this.initMonths()
    this.loadSalaryData()
  },

  initMonths() {
    const months = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      const label = d.getFullYear() + '年' + (d.getMonth() + 1) + '月'
      months.push({ value: val, label })
    }
    this.setData({ monthOptions: months, currentMonth: months[0].value })
  },

  // 月份选择
  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      monthIndex: index,
      currentMonth: this.data.monthOptions[index].value
    })
    this.loadSalaryData()
  },

  // 加载薪资数据
  async loadSalaryData() {
    util.showLoading('加载中...')
    try {
      const result = await util.callSalary('query')
      if (result.code === 200) {
        const data = result.data
        this.setData({
          totalSalary: data.totalSalary || 0,
          monthSalary: data.monthSalary || 0,
          totalHours: data.totalHours || 0,
          currentJobCount: data.currentJobCount || 0
        })
      }
      // Also load salary list
      const listResult = await util.callSalary('list', {
        month: this.data.currentMonth,
        pageNum: 1,
        pageSize: 50
      })
      util.hideLoading()
      if (listResult.code === 200) {
        const details = (listResult.data.list || []).map(item => ({
          ...item,
          workDate: util.formatCloudDate(item.workDate),
          payDate: util.formatCloudDate(item.payDate),
          payStatusText: util.getPayStatusText(item.payStatus)
        }))
        this.setData({ salaryDetailList: details })
      }
    } catch (err) {
      util.hideLoading()
      console.error('加载薪资数据失败:', err)
    }
  }
})
