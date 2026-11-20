// pages/admin/logManage/logManage.js
const util = require('../../../utils/util.js')
Page({
  data: {
    list: [], total: 0, pageNum: 1, pageSize: 20,
    typeOptions: [
      { label: '全部', value: '' },
      { label: '登录', value: 'login' },
      { label: '注册', value: 'register' },
      { label: '岗位', value: 'job' },
      { label: '申请审核', value: 'review' },
      { label: '薪资', value: 'salary' },
      { label: '学生管理', value: 'student' }
    ],
    typeIndex: 0, keyword: '', loading: false,
    backuping: false, backupInfo: null
  },
  onLoad() { this.loadLogs() },
  onShow() { this.loadLogs() },
  async loadLogs() {
    this.setData({ loading: true })
    try {
      const res = await util.callAdmin('getLogs', {
        pageNum: this.data.pageNum, pageSize: this.data.pageSize,
        type: this.data.typeOptions[this.data.typeIndex].value,
        keyword: this.data.keyword
      })
      if (res.code === 200) {
        this.setData({ list: res.data.list || [], total: res.data.total || 0, loading: false })
      } else this.setData({ loading: false })
    } catch (e) { this.setData({ loading: false }); util.showError('加载失败') }
  },
  onTypeChange(e) { this.setData({ typeIndex: e.detail.value, pageNum: 1 }, () => this.loadLogs()) },
  onKeyword(e) { this.setData({ keyword: e.detail.value }) },
  doSearch() { this.setData({ pageNum: 1 }, () => this.loadLogs()) },
  onPageChange(e) { this.setData({ pageNum: e.detail.pageNum }, () => this.loadLogs()) },

  async doBackup() {
    this.setData({ backuping: true, backupInfo: null })
    try {
      const res = await util.callAdmin('backupData')
      if (res.code === 200) {
        this.setData({ backupInfo: res.data })
        util.showSuccess('备份已生成')
      } else util.showError(res.message || '备份失败')
    } catch (e) { util.showError('备份失败') }
    finally { this.setData({ backuping: false }) }
  }
})
