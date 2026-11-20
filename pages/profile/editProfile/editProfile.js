// pages/profile/editProfile/editProfile.js
const util = require('../../../utils/util.js')
const app = getApp()

Page({
  data: {
    loading: true,
    saving: false,
    genderList: ['男', '女'],
    gradeList: ['2023级', '2024级', '2025级', '2026级'],
    familyTypeList: ['一般', '困难', '特别困难'],
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    options: { colleges: [], majors: {}, skills: [] },
    form: {
      name: '', gender: '男', college: '', major: '', grade: '', gpa: '',
      phone: '', email: '', courses: '', familyType: '一般', familyDesc: ''
    },
    selectedSkills: [],
    freeTimeList: [],
    panelCollege: false,
    panelMajor: false,
    panelSkill: false,
    panelTime: false,
    timeDays: [],
    timeStart: '08:00',
    timeEnd: '17:00'
  },

  onLoad() {
    this.loadOptions()
    this.loadProfile()
  },

  async loadOptions() {
    try {
      const res = await util.callJobs('getOptions')
      if (res.code === 200 && res.data) {
        this.setData({
          options: {
            colleges: res.data.colleges || [],
            majors: res.data.majors || {},
            skills: res.data.skills || []
          }
        })
      }
    } catch (err) { console.error('加载选项失败:', err) }
  },

  async loadProfile() {
    try {
      const res = await util.callAuth('getUserInfo')
      if (res.code === 200 && res.data) {
        const u = res.data
        const skills = Array.isArray(u.skills) ? u.skills : (u.skills ? String(u.skills).split(/[、,，]/) : [])
        const freeTimeList = u.freeTime ? String(u.freeTime).split('、').map(s => s.trim()).filter(Boolean) : []
        this.setData({
          loading: false,
          form: {
            name: u.name || '', gender: u.gender || '男', college: u.college || '', major: u.major || '',
            grade: u.grade || '', gpa: u.gpa != null ? String(u.gpa) : '', phone: u.phone || '',
            email: u.email || '', courses: u.courses || '', familyType: u.familyType || '一般', familyDesc: u.familyDesc || ''
          },
          selectedSkills: skills,
          freeTimeList
        })
      } else {
        this.setData({ loading: false })
        util.showError('加载失败')
      }
    } catch (err) { this.setData({ loading: false }); util.showError('加载失败') }
  },

  onField(e) {
    const field = (e.detail && e.detail.field) || e.currentTarget.dataset.field
    if (!field) return
    this.setData({ ['form.' + field]: e.detail.value })
  },

  onPicker(e) {
    const field = e.currentTarget.dataset.field
    const list = this.data[field + 'List']
    if (!list) return
    this.setData({ ['form.' + field]: list[Number(e.detail.value)] || '' })
  },

  // ---------- 底部弹窗 ----------
  openCollegePanel() { this.setData({ panelCollege: true }) },
  openMajorPanel() {
    if (!this.data.form.college) { util.showError('请先选择学院'); return }
    this.setData({ panelMajor: true })
  },
  openSkillPanel() { this.setData({ panelSkill: true }) },
  openTimePanel() { this.setData({ panelTime: true }) },
  closePanels() { this.setData({ panelCollege: false, panelMajor: false, panelSkill: false, panelTime: false }) },

  selectCollege(e) {
    const v = e.currentTarget.dataset.name
    const majors = this.data.options.majors[v] || []
    this.setData({ 'form.college': v, 'form.major': majors[0] || '', panelCollege: false })
  },
  selectMajor(e) { this.setData({ 'form.major': e.currentTarget.dataset.name, panelMajor: false }) },

  toggleSkill(e) {
    const n = e.currentTarget.dataset.name
    const cur = this.data.selectedSkills.slice()
    const i = cur.indexOf(n)
    if (i > -1) cur.splice(i, 1); else cur.push(n)
    this.setData({ selectedSkills: cur })
  },
  confirmSkill() { this.setData({ panelSkill: false }) },

  onDayChange(e) { this.setData({ timeDays: e.detail.value }) },
  onStartChange(e) { this.setData({ timeStart: e.detail.value }) },
  onEndChange(e) { this.setData({ timeEnd: e.detail.value }) },
  confirmTime() {
    if (!this.data.timeDays.length) { util.showError('请选择适用日'); return }
    if (this.data.timeStart >= this.data.timeEnd) { util.showError('结束时间需晚于开始时间'); return }
    const label = this.data.timeDays.join('、') + ' ' + this.data.timeStart + '-' + this.data.timeEnd
    const list = this.data.freeTimeList.slice()
    if (!list.includes(label)) list.push(label)
    this.setData({ freeTimeList: list, panelTime: false, timeDays: [], timeStart: '08:00', timeEnd: '17:00' })
  },
  removeFreeTime(e) {
    const i = e.currentTarget.dataset.index
    const list = this.data.freeTimeList.slice()
    list.splice(i, 1)
    this.setData({ freeTimeList: list })
  },

  async save() {
    const f = this.data.form
    if (!f.name.trim()) { util.showError('姓名不能为空'); return }
    if (f.phone && !util.isValidPhone(f.phone)) { util.showError('手机号格式不正确'); return }
    if (f.email && !util.isValidEmail(f.email)) { util.showError('邮箱格式不正确'); return }
    if (f.gpa && (Number(f.gpa) < 0 || Number(f.gpa) > 4)) { util.showError('绩点需在 0-4 之间'); return }

    this.setData({ saving: true })
    try {
      const payload = {
        name: f.name.trim(), gender: f.gender, college: f.college.trim(), major: f.major.trim(),
        grade: f.grade, gpa: f.gpa === '' ? 0 : Number(f.gpa), phone: f.phone.trim(), email: f.email.trim(),
        freeTime: this.data.freeTimeList.join('、'),
        skills: this.data.selectedSkills.join('、'),
        courses: f.courses.trim(), familyType: f.familyType, familyDesc: f.familyDesc.trim()
      }
      const res = await util.callAuth('updateProfile', payload)
      if (res.code === 200) {
        const userInfo = app.globalData.userInfo || {}
        app.globalData.userInfo = Object.assign({}, userInfo, payload)
        util.showSuccess('保存成功')
        setTimeout(() => wx.navigateBack(), 800)
      } else {
        util.showError(res.message || '保存失败')
      }
    } catch (err) { util.showError('保存失败') }
    finally { this.setData({ saving: false }) }
  }
})
