// pages/salaryQuery/salaryQuery.js
const util = require('../../utils/util.js')

Page({
  data: {
    totalSalary: 0,
    monthSalary: 0,
    totalHours: 0,
    currentJobCount: 0,
    monthList: ['2026年4月', '2026年3月', '2026年2月', '2026年1月'],
    monthIndex: 0,
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
    this.loadSalaryData()
  },

  // 月份选择
  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      monthIndex: index
    })
    this.loadSalaryData()
  },

  // 加载薪资数据
  loadSalaryData() {
    util.showLoading('加载中...')

    // TODO: 调用后端接口
    setTimeout(() => {
      util.hideLoading()

      // 模拟数据
      this.setData({
        totalSalary: 1200,
        monthSalary: 480,
        totalHours: 80,
        currentJobCount: 2,
        monthData: {
          shouldPay: 480,
          actualPay: 480,
          workHours: 32,
          payStatus: 'paid',
          payStatusText: '已发放'
        },
        salaryDetailList: [
          {
            recordId: 1,
            jobId: 1,
            jobName: '图书馆助理',
            workDate: '2026-04-15',
            workHours: 4,
            hourlyRate: 15,
            amount: 60,
            remark: '',
            payStatus: 'paid',
            payStatusText: '已发放',
            payDate: '2026-04-20'
          },
          {
            recordId: 2,
            jobId: 1,
            jobName: '图书馆助理',
            workDate: '2026-04-12',
            workHours: 4,
            hourlyRate: 15,
            amount: 60,
            remark: '加班1小时',
            payStatus: 'paid',
            payStatusText: '已发放',
            payDate: '2026-04-20'
          },
          {
            recordId: 3,
            jobId: 2,
            jobName: '实验室助理',
            workDate: '2026-04-14',
            workHours: 3,
            hourlyRate: 20,
            amount: 60,
            remark: '',
            payStatus: 'pending',
            payStatusText: '待发放',
            payDate: ''
          }
        ]
      })
    }, 500)
  }
})
