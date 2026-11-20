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
    form: {
      name: '', gender: '男', college: '', major: '', grade: '', gpa: '',
      phone: '', email: '', freeTime: '', skills: '', preferredJobTypes: [],
      courses: '', familyType: '一般', familyDesc: ''
    }
  },

  onLoad() {
    this.loadProfile()
  },

  async loadProfile() {
    try {
      const res = await util.callAuth('getUserInfo')
      if (res.code === 200 && res.data) {
        const u = res.data
        this.setData({
          loading: false,
          form: {
            name: u.name || '',
            gender: u.gender || '男',
            college: u.college || '',
            major: u.major || '',
            grade: u.grade || '',
            gpa: u.gpa != null ? String(u.gpa) : '',
            phone: u.phone || '',
            email: u.email || '',
            freeTime: u.freeTime || '',
            skills: Array.isArray(u.skills) ? u.skills.join('、') : (u.skills || ''),
            preferredJobTypes: u.preferredJobTypes || [],
            courses: u.courses || '',
            familyType: u.familyType || '一般',
            familyDesc: u.familyDesc || ''
          }
        })
      } else {
        this.setData({ loading: false })
        util.showError('加载失败')
      }
    } catch (err) {
      this.setData({ loading: false })
      util.showError('加载失败')
    }
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

  onJobTypeChange(e) {
    this.setData({ 'form.preferredJobTypes': e.detail.value })
  },

  async save() {
    const f = this.data.form
    if (!f.name.trim()) { util.showError('姓名不能为空'); return }
    if (f.phone && !util.isValidPhone(f.phone)) { util.showError('手机号格式不正确'); return }
    if (f.email && !util.isValidEmail(f.email)) { util.showError('邮箱格式不正确'); return }
    if (f.gpa && (Number(f.gpa) < 0 || Number(f.gpa) > 4)) { util.showError('GPA 需在 0-4 之间'); return }

    this.setData({ saving: true })
    try {
      const payload = {
        name: f.name.trim(),
        gender: f.gender,
        college: f.college.trim(),
        major: f.major.trim(),
        grade: f.grade,
        gpa: f.gpa === '' ? 0 : Number(f.gpa),
        phone: f.phone.trim(),
        email: f.email.trim(),
        freeTime: f.freeTime.trim(),
        skills: f.skills,
        preferredJobTypes: f.preferredJobTypes,
        courses: f.courses.trim(),
        familyType: f.familyType,
        familyDesc: f.familyDesc.trim()
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
    } catch (err) {
      util.showError('保存失败')
    } finally {
      this.setData({ saving: false })
    }
  }
})
