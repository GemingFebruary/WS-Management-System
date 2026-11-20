// pages/admin/optionManage/optionManage.js
const util = require('../../../utils/util.js')
Page({
  data: {
    loading: false, saving: false,
    colleges: [], majors: {}, skills: [],
    newCollege: '', newMajor: '', newSkill: '',
    activeCollege: ''
  },
  onLoad() { this.loadOptions() },
  async loadOptions() {
    this.setData({ loading: true })
    try {
      const res = await util.callAdmin('getOptions')
      if (res.code === 200 && res.data) {
        const d = res.data
        this.setData({
          colleges: d.colleges || [],
          majors: d.majors || {},
          skills: d.skills || [],
          activeCollege: (d.colleges && d.colleges[0]) || ''
        })
      }
    } catch (e) { util.showError('加载失败') }
    finally { this.setData({ loading: false }) }
  },
  onNewCollege(e) { this.setData({ newCollege: e.detail.value }) },
  onNewSkill(e) { this.setData({ newSkill: e.detail.value }) },
  onNewMajor(e) { this.setData({ newMajor: e.detail.value }) },
  onActiveCollege(e) { this.setData({ activeCollege: this.data.colleges[e.detail.value] }) },
  addCollege() {
    const v = this.data.newCollege.trim()
    if (!v) return
    if (this.data.colleges.includes(v)) { util.showError('学院已存在'); return }
    const colleges = this.data.colleges.concat([v])
    const majors = Object.assign({}, this.data.majors, { [v]: [] })
    this.setData({ colleges, majors, newCollege: '', activeCollege: v })
  },
  removeCollege(e) {
    const name = e.currentTarget.dataset.name
    const colleges = this.data.colleges.filter(c => c !== name)
    const majors = Object.assign({}, this.data.majors)
    delete majors[name]
    this.setData({ colleges, majors, activeCollege: colleges[0] || '' })
  },
  addSkill() {
    const v = this.data.newSkill.trim()
    if (!v) return
    if (this.data.skills.includes(v)) { util.showError('技能已存在'); return }
    this.setData({ skills: this.data.skills.concat([v]), newSkill: '' })
  },
  removeSkill(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ skills: this.data.skills.filter(s => s !== name) })
  },
  addMajor() {
    const v = this.data.newMajor.trim()
    const college = this.data.activeCollege
    if (!v || !college) return
    const list = (this.data.majors[college] || []).slice()
    if (list.includes(v)) { util.showError('专业已存在'); return }
    list.push(v)
    this.setData({ [`majors.${college}`]: list, newMajor: '' })
  },
  removeMajor(e) {
    const college = this.data.activeCollege
    const idx = e.currentTarget.dataset.index
    const list = (this.data.majors[college] || []).slice()
    list.splice(idx, 1)
    this.setData({ [`majors.${college}`]: list })
  },
  async save() {
    this.setData({ saving: true })
    try {
      const res = await util.callAdmin('updateOptions', {
        colleges: this.data.colleges,
        majors: this.data.majors,
        skills: this.data.skills
      })
      if (res.code === 200) util.showSuccess('保存成功')
      else util.showError(res.message || '保存失败')
    } catch (e) { util.showError('保存失败') }
    finally { this.setData({ saving: false }) }
  }
})
