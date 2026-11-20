const util = require('../../../utils/util.js')

Page({
  data: {
    // 月份筛选
    monthOptions: [],
    monthIndex: 0,
    currentMonth: '',
    // 状态筛选
    statusOptions: ['全部状态', '待发放', '已发放'],
    statusIndex: 0,
    // 搜索
    searchKeyword: '',
    // 列表
    salaryList: [],
    totalRecords: 0,
    loading: false,
    pageNum: 1,
    pageSize: 20,
    // 汇总
    summary: null,
    summaryLoading: false,
    // 录入弹窗
    showRecordModal: false,
    recordForm: { studentId: '', jobId: '', jobName: '', workDate: '', workHours: '4', hourlyRate: '15', remark: '' },
    // 编辑弹窗
    showEditModal: false,
    editForm: { recordId: '', workDate: '', workHours: '', hourlyRate: '', jobName: '', remark: '' },
    // 删除确认
    showDeleteModal: false,
    deleteTarget: null,
    // 发放确认
    showPayModal: false,
    payTarget: null,
    // 批量
    selectedIds: [],
    selectAll: false
  },

  onLoad() {
    this.initMonths()
    this.loadSalaryList()
    this.loadSummary()
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

  onMonthChange(e) {
    const idx = e.detail.value
    this.setData({ monthIndex: idx, currentMonth: this.data.monthOptions[idx].value, pageNum: 1, selectedIds: [], selectAll: false })
    this.loadSalaryList()
    this.loadSummary()
  },

  onStatusChange(e) {
    this.setData({ statusIndex: e.detail.value, pageNum: 1, selectedIds: [], selectAll: false })
    this.loadSalaryList()
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  doSearch() {
    this.setData({ pageNum: 1 })
    this.loadSalaryList()
  },

  async loadSalaryList() {
    this.setData({ loading: true })
    try {
      const res = await util.callSalary('list', {
        month: this.data.currentMonth,
        studentId: this.data.searchKeyword || undefined,
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize
      })
      if (res && res.code === 200) {
        let list = res.data.list || []
        // 客户端状态筛选
        const statusMap = { 1: 'unpaid', 2: 'paid' }
        if (statusMap[this.data.statusIndex]) {
          list = list.filter(r => r.payStatus === statusMap[this.data.statusIndex])
        }
        this.setData({
          salaryList: list,
          totalRecords: res.data.total || 0
        })
      }
    } catch (err) {
      console.error('加载薪资列表失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadSummary() {
    if (!this.data.currentMonth) return
    this.setData({ summaryLoading: true })
    try {
      const res = await util.callSalary('calculate', { month: this.data.currentMonth })
      if (res && res.code === 200) {
        this.setData({ summary: res.data })
      }
    } catch (err) {
      console.error('加载汇总失败:', err)
    } finally {
      this.setData({ summaryLoading: false })
    }
  },

  // 录入弹窗
  openRecordModal() {
    const today = new Date().toISOString().slice(0, 10)
    this.setData({
      showRecordModal: true,
      recordForm: { studentId: '', jobId: '', jobName: '', workDate: today, workHours: '4', hourlyRate: '15', remark: '' }
    })
  },

  closeRecordModal() { this.setData({ showRecordModal: false }) },

  onRecordInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['recordForm.' + field]: e.detail.value })
  },

  async submitRecord() {
    const f = this.data.recordForm
    if (!f.studentId || !f.jobId || !f.workDate) {
      util.showToast('请填写必填项', 'info')
      return
    }
    try {
      const res = await util.callSalary('record', {
        studentId: f.studentId,
        jobId: f.jobId,
        jobName: f.jobName,
        workDate: f.workDate,
        workHours: parseFloat(f.workHours),
        hourlyRate: parseFloat(f.hourlyRate)
      })
      if (res && res.code === 200) {
        this.setData({ showRecordModal: false })
        util.showSuccess('录入成功')
        this.loadSalaryList()
        this.loadSummary()
      } else {
        util.showError(res.message || '录入失败')
      }
    } catch (err) {
      util.showError('录入失败')
    }
  },

  // 编辑弹窗
  openEditModal(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showEditModal: true,
      editForm: {
        recordId: item._id || item.recordId,
        workDate: item.workDate || '',
        workHours: String(item.workHours || ''),
        hourlyRate: String(item.hourlyRate || ''),
        jobName: item.jobName || '',
        remark: item.remark || ''
      }
    })
  },

  closeEditModal() { this.setData({ showEditModal: false }) },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['editForm.' + field]: e.detail.value })
  },

  async submitEdit() {
    const f = this.data.editForm
    try {
      const res = await util.callSalary('edit', {
        recordId: f.recordId,
        workDate: f.workDate,
        workHours: parseFloat(f.workHours),
        hourlyRate: parseFloat(f.hourlyRate),
        jobName: f.jobName,
        remark: f.remark
      })
      if (res && res.code === 200) {
        this.setData({ showEditModal: false })
        util.showSuccess('更新成功')
        this.loadSalaryList()
        this.loadSummary()
      } else {
        util.showError(res.message || '更新失败')
      }
    } catch (err) {
      util.showError('更新失败')
    }
  },

  // 删除
  confirmDelete(e) {
    this.setData({ showDeleteModal: true, deleteTarget: e.currentTarget.dataset.item })
  },

  closeDeleteModal() { this.setData({ showDeleteModal: false, deleteTarget: null }) },

  async doDelete() {
    const target = this.data.deleteTarget
    if (!target) return
    try {
      const res = await util.callSalary('delete', { recordId: target._id || target.recordId })
      if (res && res.code === 200) {
        this.setData({ showDeleteModal: false, deleteTarget: null })
        util.showSuccess('删除成功')
        this.loadSalaryList()
        this.loadSummary()
      } else {
        util.showError(res.message || '删除失败')
      }
    } catch (err) {
      util.showError('删除失败')
    }
  },

  // 单条发放
  confirmPay(e) {
    this.setData({ showPayModal: true, payTarget: e.currentTarget.dataset.item })
  },

  closePayModal() { this.setData({ showPayModal: false, payTarget: null }) },

  async doPay() {
    const target = this.data.payTarget
    if (!target) return
    try {
      const res = await util.callSalary('adminPay', { recordIds: [target._id || target.recordId] })
      if (res && res.code === 200) {
        this.setData({ showPayModal: false, payTarget: null })
        util.showSuccess('发放成功')
        this.loadSalaryList()
        this.loadSummary()
      } else {
        util.showError(res.message || '发放失败')
      }
    } catch (err) {
      util.showError('发放失败')
    }
  },

  // 选择/全选
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    let ids = [...this.data.selectedIds]
    const idx = ids.indexOf(id)
    if (idx >= 0) { ids.splice(idx, 1) } else { ids.push(id) }
    this.setData({ selectedIds: ids })
  },

  toggleSelectAll() {
    const unpaid = this.data.salaryList.filter(r => r.payStatus !== 'paid')
    if (this.data.selectedIds.length === unpaid.length) {
      this.setData({ selectedIds: [], selectAll: false })
    } else {
      this.setData({ selectedIds: unpaid.map(r => r._id || r.recordId), selectAll: true })
    }
  },

  // 批量发放
  async doBatchPay() {
    if (this.data.selectedIds.length === 0) {
      util.showToast('请先选择记录', 'info')
      return
    }
    wx.showModal({
      title: '批量发放',
      content: '确定发放选中的 ' + this.data.selectedIds.length + ' 条记录？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          const result = await util.callSalary('adminPay', { recordIds: this.data.selectedIds })
          if (result && result.code === 200) {
            this.setData({ selectedIds: [], selectAll: false })
            util.showSuccess('发放成功')
            this.loadSalaryList()
            this.loadSummary()
          } else {
            util.showError(result.message || '发放失败')
          }
        } catch (err) {
          util.showError('发放失败')
        }
      }
    })
  },

  // 按月发放
  async doPayByMonth() {
    wx.showModal({
      title: '按月发放',
      content: '确定发放 ' + this.data.currentMonth + ' 月全部待发放薪资？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          const result = await util.callSalary('adminPay', { month: this.data.currentMonth })
          if (result && result.code === 200) {
            util.showSuccess('发放成功')
            this.loadSalaryList()
            this.loadSummary()
          } else {
            util.showError(result.message || '发放失败')
          }
        } catch (err) {
          util.showError('发放失败')
        }
      }
    })
  },

  // 分页
  prevPage() {
    if (this.data.pageNum <= 1) return
    this.setData({ pageNum: this.data.pageNum - 1 })
    this.loadSalaryList()
  },

  nextPage() {
    if (this.data.pageNum * this.data.pageSize >= this.data.totalRecords) return
    this.setData({ pageNum: this.data.pageNum + 1 })
    this.loadSalaryList()
  },

  // 阻止冒泡
  stopBubble() {}
})
