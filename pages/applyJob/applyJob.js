// pages/applyJob/applyJob.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    jobId: null,
    jobInfo: {},
    applyForm: {
      name: '',
      studentId: '',
      college: '',
      major: '',
      grade: '',
      phone: '',
      email: '',
      experience: '',
      reason: ''
    },
    timeRange: [
      ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      ['上午', '下午', '晚上']
    ],
    timeIndex: [0, 0],
    selectedTime: '',
    fileList: []
  },

  onLoad(options) {
    const jobId = options.jobId
    this.setData({
      jobId: jobId
    })
    this.loadJobInfo(jobId)
    this.initUserInfo()
  },

  // 加载岗位信息
  loadJobInfo(jobId) {
    // TODO: 调用后端接口
    setTimeout(() => {
      this.setData({
        jobInfo: {
          jobId: jobId,
          jobName: '图书馆助理',
          department: '图书馆',
          salary: 15
        }
      })
    }, 300)
  },

  // 初始化用户信息
  initUserInfo() {
    const userInfo = app.globalData.userInfo || {}
    this.setData({
      'applyForm.name': userInfo.name || '',
      'applyForm.studentId': userInfo.studentId || userInfo.account || '',
      'applyForm.college': userInfo.college || '',
      'applyForm.major': userInfo.major || '',
      'applyForm.grade': userInfo.grade || '',
      'applyForm.phone': userInfo.phone || ''
    })
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      'applyForm.phone': e.detail.value
    })
  },

  // 邮箱输入
  onEmailInput(e) {
    this.setData({
      'applyForm.email': e.detail.value
    })
  },

  // 时间选择
  onTimeChange(e) {
    const index = e.detail.value
    const day = this.data.timeRange[0][index[0]]
    const period = this.data.timeRange[1][index[1]]
    
    this.setData({
      timeIndex: index,
      selectedTime: `${day}${period}`
    })
  },

  // 经验输入
  onExperienceInput(e) {
    this.setData({
      'applyForm.experience': e.detail.value
    })
  },

  // 申请理由输入
  onReasonInput(e) {
    this.setData({
      'applyForm.reason': e.detail.value
    })
  },

  // 上传文件
  uploadFile() {
    wx.chooseMessageFile({
      count: 3,
      type: 'file',
      success: (res) => {
        const files = res.tempFiles
        const fileList = this.data.fileList
        
        files.forEach(file => {
          fileList.push({
            name: file.name,
            path: file.path,
            size: file.size
          })
        })
        
        this.setData({
          fileList: fileList
        })
        
        util.showSuccess('上传成功')
      }
    })
  },

  // 删除文件
  removeFile(e) {
    const index = e.currentTarget.dataset.index
    const fileList = this.data.fileList
    fileList.splice(index, 1)
    
    this.setData({
      fileList: fileList
    })
  },

  // 表单验证
  validateForm() {
    const { applyForm, selectedTime } = this.data
    const errors = []

    // 手机号验证
    if (!applyForm.phone) {
      errors.push({ field: 'phone', message: '请输入手机号' })
    } else if (!/^1[3-9]\d{9}$/.test(applyForm.phone)) {
      errors.push({ field: 'phone', message: '手机号格式不正确' })
    }

    // 邮箱验证（可选）
    if (applyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email)) {
      errors.push({ field: 'email', message: '邮箱格式不正确' })
    }

    // 时间选择验证
    if (!selectedTime) {
      errors.push({ field: 'time', message: '请选择可工作时间' })
    }

    // 申请理由验证
    if (!applyForm.reason) {
      errors.push({ field: 'reason', message: '请填写申请理由' })
    } else if (applyForm.reason.length < 20) {
      errors.push({ field: 'reason', message: '申请理由至少20个字' })
    } else if (applyForm.reason.length > 500) {
      errors.push({ field: 'reason', message: '申请理由最多500个字' })
    }

    return errors
  },

  // 显示表单错误
  showFormError(errors) {
    if (errors.length === 0) return true
    
    // 显示第一个错误
    const firstError = errors[0]
    util.showError(firstError.message)
    
    // 可以在这里添加字段高亮逻辑
    // 例如：通过 setData 设置对应字段的错误状态
    const errorFields = {}
    errors.forEach(err => {
      errorFields[`${err.field}Error`] = err.message
    })
    this.setData(errorFields)
    
    return false
  },

  // 清除字段错误
  clearFieldError(e) {
    const field = e.currentTarget.dataset.field
    if (field) {
      this.setData({
        [`${field}Error`]: ''
      })
    }
  },

  // 提交申请
  async handleSubmit() {
    // 执行表单验证
    const errors = this.validateForm()
    if (!this.showFormError(errors)) {
      return
    }

    const { applyForm, selectedTime, jobId, fileList } = this.data

    util.showLoading('提交中...')

    try {
      // 调用云函数提交申请
      const result = await util.callApplications('submit', {
        jobId: jobId,
        reason: applyForm.reason,
        phone: applyForm.phone,
        email: applyForm.email,
        availableTime: selectedTime,
        experience: applyForm.experience,
        attachments: fileList.map(f => f.path)
      })

      util.hideLoading()

      if (result.code === 200) {
        util.showSuccess('申请提交成功')
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        util.showError(result.message || '提交失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleCloudError(err, '提交申请失败')
    }
  }
})
