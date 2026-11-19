// pages/register/register.js
const util = require('../../utils/util.js')

Page({
  data: {
    studentInfo: {
      studentId: '',
      name: '',
      gender: '男',
      college: '',
      major: '',
      grade: '',
      phone: '',
      email: '',
      familyType: '一般',
      familyDesc: ''
    },
    password: '',
    confirmPassword: '',
    genderList: ['男', '女'],
    genderIndex: 0,
    gradeList: ['2023级', '2024级', '2025级', '2026级'],
    gradeIndex: 0,
    familyTypeList: ['困难', '特别困难', '一般']
  },

  // 学号输入
  onStudentIdInput(e) {
    this.setData({
      'studentInfo.studentId': e.detail.value
    })
  },

  // 姓名输入
  onNameInput(e) {
    this.setData({
      'studentInfo.name': e.detail.value
    })
  },

  // 性别选择
  onGenderChange(e) {
    const index = e.detail.value
    this.setData({
      genderIndex: index,
      'studentInfo.gender': this.data.genderList[index]
    })
  },

  // 学院输入
  onCollegeInput(e) {
    this.setData({
      'studentInfo.college': e.detail.value
    })
  },

  // 专业输入
  onMajorInput(e) {
    this.setData({
      'studentInfo.major': e.detail.value
    })
  },

  // 年级选择
  onGradeChange(e) {
    const index = e.detail.value
    this.setData({
      gradeIndex: index,
      'studentInfo.grade': this.data.gradeList[index]
    })
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      'studentInfo.phone': e.detail.value
    })
  },

  // 邮箱输入
  onEmailInput(e) {
    this.setData({
      'studentInfo.email': e.detail.value
    })
  },

  // 家庭类型选择
  onFamilyTypeChange(e) {
    const index = e.detail.value
    this.setData({
      familyTypeIndex: index,
      'studentInfo.familyType': this.data.familyTypeList[index]
    })
  },

  // 家庭情况描述输入
  onFamilyDescInput(e) {
    this.setData({
      'studentInfo.familyDesc': e.detail.value
    })
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    })
  },

  // 处理注册
  async handleRegister() {
    const { studentInfo, password, confirmPassword } = this.data

    // 表单验证
    if (!studentInfo.studentId) {
      util.showError('请输入学号')
      return
    }
    if (!studentInfo.name) {
      util.showError('请输入姓名')
      return
    }
    if (!studentInfo.college) {
      util.showError('请输入学院')
      return
    }
    if (!studentInfo.major) {
      util.showError('请输入专业')
      return
    }
    if (!studentInfo.grade) {
      util.showError('请选择年级')
      return
    }
    if (!studentInfo.phone) {
      util.showError('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(studentInfo.phone)) {
      util.showError('手机号格式不正确')
      return
    }
    if (!password) {
      util.showError('请设置密码')
      return
    }
    if (password.length < 6 || password.length > 20) {
      util.showError('密码长度为6-20位')
      return
    }
    if (password !== confirmPassword) {
      util.showError('两次输入的密码不一致')
      return
    }

    util.showLoading('注册中...')

    try {
      // 调用云函数注册
      const result = await wx.cloud.callFunction({
        name: 'auth',
        data: {
          action: 'register',
          ...studentInfo,
          password
        }
      })

      util.hideLoading()

      if (result.result.code === 200) {
        util.showSuccess('注册成功，请登录')

        // 跳转到登录页
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }, 1500)
      } else {
        util.showError(result.result.message || '注册失败')
      }
    } catch (err) {
      util.hideLoading()
      console.error('注册失败:', err)
      util.showError(err.errMsg || '注册失败，请检查网络连接')
    }
  },

  // 跳转到登录页
  goToLogin() {
    wx.redirectTo({
      url: '/pages/login/login'
    })
  }
})
