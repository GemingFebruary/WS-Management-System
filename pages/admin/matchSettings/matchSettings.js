// pages/admin/matchSettings/matchSettings.js
Page({
  data: {
    dimensions: [
      { key: 'skill', name: '技能标签', desc: '学生技能与岗位要求的匹配程度' },
      { key: 'time', name: '可工作时间', desc: '学生空闲时间与岗位工作时间的重合度' },
      { key: 'preference', name: '岗位类型偏好', desc: '学生偏好类型与岗位类型（校内/校外）的符合度' },
      { key: 'conflict', name: '年级/课程', desc: '年级要求与课程时间冲突情况' }
    ],
    weights: { skill: 25, time: 25, preference: 25, conflict: 25 },
    loading: false,
    saving: false
  },

  onLoad() {
    this.loadConfig()
  },

  async loadConfig() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'jobs', data: { action: 'getMatchConfig' } })
      const r = res.result || {}
      if (r.code === 200 && r.data && r.data.weights) {
        this.setData({ weights: r.data.weights })
      }
    } catch (err) {
      console.error('加载匹配权重失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onWeightChange(e) {
    const key = e.currentTarget.dataset.key
    const val = Number(e.detail.value) || 0
    this.setData({ ['weights.' + key]: val })
  },

  async saveConfig() {
    const w = this.data.weights
    const total = (Number(w.skill) || 0) + (Number(w.time) || 0) + (Number(w.preference) || 0) + (Number(w.conflict) || 0)
    if (total <= 0) {
      wx.showToast({ title: '权重总和需大于 0', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'jobs', data: { action: 'updateMatchConfig', weights: w } })
      const r = res.result || {}
      if (r.code === 200) {
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        wx.showToast({ title: r.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('保存匹配权重失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
