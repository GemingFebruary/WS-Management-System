// pages/admin/jobEdit/jobEdit.js
const util = require('../../../utils/util.js')
Page({
  data: {
    isEdit: false,
    jobId: '',
    saving: false,
    options: { skills: [], jobCategories: [] },
    form: {
      jobName: '', department: '', jobType: '校内', recruitNum: 1, salary: 15,
      workTime: '', jobCategory: '', requiredSkills: [], requiredMajor: '', requiredGrade: '', minGpa: 0,
      requirement: '', jobContent: '', contactPerson: '', contactPhone: '', contactEmail: '',
      status: 'recruiting'
    },
    panelSkill: false
  },

  onLoad(options) {
    this.loadOptions()
    if (options && options.jobId) {
      this.setData({ isEdit: true, jobId: options.jobId })
      this.loadJob(options.jobId)
    }
  },

  async loadOptions() {
    try {
      const res = await util.callJobs('getOptions')
      if (res.code === 200 && res.data) {
        this.setData({ 'options.skills': res.data.skills || [], 'options.jobCategories': res.data.jobCategories || [] })
      }
    } catch (e) { console.error(e) }
  },

  async loadJob(jobId) {
    try {
      const res = await util.callJobs('detail', { jobId })
      if (res.code === 200 && res.data) {
        const j = res.data
        this.setData({
          form: {
            jobName: j.jobName || '', department: j.department || '', jobType: j.jobType || '校内',
            recruitNum: j.recruitNum || 1, salary: j.salary || 15, workTime: j.workTime || '',
            requiredSkills: j.requiredSkills || [], requiredMajor: j.requiredMajor || '',
            requiredGrade: j.requiredGrade || '', minGpa: j.minGpa || 0,
            requirement: j.requirement || '', jobContent: j.jobContent || '',
            contactPerson: j.contactPerson || '', contactPhone: j.contactPhone || '',
            contactEmail: j.contactEmail || '', status: j.status || 'recruiting'
          }
        })
      }
    } catch (e) { util.showError('加载岗位失败') }
  },

  onField(e) {
    const f = e.currentTarget.dataset.field
    this.setData({ ['form.' + f]: e.detail.value })
  },
  onPicker(e) {
    const f = e.currentTarget.dataset.field
    const map = { jobType: ['校内', '校外'], status: ['recruiting', 'full', 'closed'], jobCategory: this.data.options.jobCategories }
    const list = map[f]
    if (!list) return
    this.setData({ ['form.' + f]: list[Number(e.detail.value)] || '' })
  },
  onNumber(e) {
    const f = e.currentTarget.dataset.field
    this.setData({ ['form.' + f]: Number(e.detail.value) || 0 })
  },

  openSkillPanel() { this.setData({ panelSkill: true }) },
  toggleSkill(e) {
    const n = e.currentTarget.dataset.name
    const cur = this.data.form.requiredSkills.slice()
    const i = cur.indexOf(n)
    if (i > -1) cur.splice(i, 1); else cur.push(n)
    this.setData({ 'form.requiredSkills': cur })
  },
  closeSkill() { this.setData({ panelSkill: false }) },

  async save() {
    const f = this.data.form
    if (!f.jobName.trim() || !f.department.trim()) { util.showError('请填写岗位名称和所属部门'); return }
    if (!f.workTime.trim()) { util.showError('请填写工作时间'); return }
    this.setData({ saving: true })
    try {
      const payload = Object.assign({}, f, { requiredSkills: f.requiredSkills })
      const res = this.data.isEdit
        ? await util.callJobs('update', Object.assign({ jobId: this.data.jobId }, payload))
        : await util.callJobs('create', payload)
      if (res.code === 200) {
        util.showSuccess(this.data.isEdit ? '保存成功' : '发布成功')
        setTimeout(() => wx.navigateBack(), 800)
      } else {
        util.showError(res.message || '保存失败')
      }
    } catch (e) { util.showError('保存失败') }
    finally { this.setData({ saving: false }) }
  }
})
