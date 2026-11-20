// pages/admin/dataStats/dataStats.js
const util = require('../../../utils/util.js')
Page({
  data: {
    stats: {},
    ecJob: {}, ecApp: {}, ecSalary: {}
  },
  onLoad() { this.load() },
  onShow() { this.load() },
  async load() {
    try {
      const res = await util.callAdmin('statsDetail')
      if (res.code === 200) {
        const s = res.data
        this.setData({
          stats: s,
          ecJob: { option: this.jobOption(s.jobByStatus) },
          ecApp: { option: this.appOption(s.appByStatus) },
          ecSalary: { option: this.salaryOption(s.salaryByMonth) }
        })
      }
    } catch (e) { util.showError('加载统计失败') }
  },
  jobOption(j) {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '68%'],
        data: [
          { name: '招聘中', value: j.recruiting || 0 },
          { name: '已满员', value: j.full || 0 },
          { name: '已关闭', value: j.closed || 0 }
        ]
      }]
    }
  },
  appOption(a) {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '68%'],
        data: [
          { name: '待审核', value: a.pending || 0 },
          { name: '已通过', value: a.approved || 0 },
          { name: '已驳回', value: a.rejected || 0 },
          { name: '已取消', value: a.cancelled || 0 }
        ]
      }]
    }
  },
  salaryOption(m) {
    const keys = Object.keys(m || {}).sort()
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: keys },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: keys.map(k => Math.round(m[k] * 10) / 10), itemStyle: { color: '#4A90E2' } }]
    }
  }
})
