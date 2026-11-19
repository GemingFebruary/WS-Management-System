// utils/util.js

/**
 * 格式化时间
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${[year, month, day].map(formatNumber).join('-')}`
}

/**
 * 格式化云数据库日期字段为 YYYY-MM-DD
 * 兼容：字符串、{$date: ms}、Date 对象、时间戳
 */
const formatCloudDate = (date) => {
  if (!date) return ''
  if (typeof date === 'string') return date.substring(0, 10)
  if (typeof date === 'object' && date.$date) {
    return formatDate(new Date(date.$date))
  }
  if (date instanceof Date) return formatDate(date)
  if (typeof date === 'number') return formatDate(new Date(date))
  try { return formatDate(new Date(date)) } catch (e) { return String(date) }
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 显示加载提示
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 显示成功提示
 */
const showSuccess = (title = '操作成功') => {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 */
const showError = (title = '操作失败') => {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 发送网络请求（HTTP方式）
 */
const request = (options) => {
  const app = getApp()
  const baseUrl = app.globalData.baseUrl
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          showError(res.data.message || '请求失败')
          reject(res.data)
        }
      },
      fail: (err) => {
        showError('网络请求失败')
        reject(err)
      }
    })
  })
}

/**
 * 调用云函数（推荐方式）
 * @param {string} name - 云函数名称
 * @param {object} data - 传递给云函数的数据
 * @returns {Promise}
 */
const callCloudFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    // 自动附带 token（供云函数回退验证）
    const tokenData = wx.getStorageSync('tokenData')
    if (tokenData && tokenData.token && Date.now() < tokenData.expireTime) {
      data.token = tokenData.token
    }
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        if (res.result && res.result.code === 200) {
          resolve(res.result)
        } else {
          const errMsg = (res.result && res.result.message) || '操作失败'
          showError(errMsg)
          reject(res.result)
        }
      },
      fail: (err) => {
        console.error('云函数调用失败:', err)
        showError('云函数调用失败')
        reject(err)
      }
    })
  })
}

/**
 * 便捷方法：调用认证云函数
 */
const callAuth = (action, params = {}) => {
  return callCloudFunction('auth', { action, ...params })
}

/**
 * 便捷方法：调用岗位云函数
 */
const callJobs = (action, params = {}) => {
  return callCloudFunction('jobs', { action, ...params })
}

/**
 * 便捷方法：调用申请云函数
 */
const callApplications = (action, params = {}) => {
  return callCloudFunction('applications', { action, ...params })
}

/**
 * 便捷方法：调用薪资云函数
 */
const callSalary = (action, params = {}) => {
  return callCloudFunction('salary', { action, ...params })
}

/**
 * 便捷方法：调用管理员云函数
 */
const callAdmin = (action, params = {}) => {
  return callCloudFunction('admin', { action, ...params })
}

/**
 * 检查登录状态
 */
const checkLogin = () => {
  const app = getApp()
  if (!app.globalData.isLogin) {
    wx.redirectTo({
      url: '/pages/login/login'
    })
    return false
  }
  return true
}

/**
 * 计算匹配度
 */
const calculateMatchScore = (studentInfo, jobInfo) => {
  let score = 0
  let totalWeight = 0
  
  // 专业匹配
  if (studentInfo.major && jobInfo.requiredMajor) {
    totalWeight += 30
    if (studentInfo.major === jobInfo.requiredMajor) {
      score += 30
    }
  }
  
  // 年级匹配
  if (studentInfo.grade && jobInfo.requiredGrade) {
    totalWeight += 20
    if (studentInfo.grade === jobInfo.requiredGrade) {
      score += 20
    }
  }
  
  // 成绩匹配
  if (studentInfo.gpa && jobInfo.minGpa) {
    totalWeight += 25
    if (studentInfo.gpa >= jobInfo.minGpa) {
      score += 25
    }
  }
  
  // 空闲时间匹配
  if (studentInfo.freeTime && jobInfo.workTime) {
    totalWeight += 25
    const matchTime = checkTimeMatch(studentInfo.freeTime, jobInfo.workTime)
    score += 25 * matchTime
  }
  
  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0
}

/**
 * 检查时间是否匹配
 */
const checkTimeMatch = (freeTime, workTime) => {
  if (!freeTime || !workTime) return 0.5
  return freeTime.includes(workTime) ? 1 : 0.3
}

/**
 * 获取岗位状态文本
 * @param {string} status - 岗位状态
 * @returns {string} 状态文本
 */
const getJobStatusText = (status) => {
  const statusMap = {
    'recruiting': '招聘中',
    'full': '已满员',
    'closed': '已关闭'
  }
  return statusMap[status] || '未知'
}

/**
 * 获取申请状态文本
 * @param {string} status - 申请状态
 * @returns {string} 状态文本
 */
const getApplicationStatusText = (status) => {
  const statusMap = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已驳回',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知'
}

/**
 * 获取薪资状态文本
 * @param {string} status - 薪资状态
 * @returns {string} 状态文本
 */
const getPayStatusText = (status) => {
  const statusMap = {
    'paid': '已发放',
    'unpaid': '待发放'
  }
  return statusMap[status] || '未知'
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
const debounce = (fn, delay = 300) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function}
 */
const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 处理云函数错误
 * @param {Error} err - 错误对象
 * @param {string} defaultMsg - 默认错误消息
 */
const handleCloudError = (err, defaultMsg = '操作失败') => {
  console.error('云函数错误:', err)

  if (err.errMsg) {
    if (err.errMsg.includes('timeout')) {
      showError('请求超时，请重试')
    } else if (err.errMsg.includes('network')) {
      showError('网络错误，请检查网络连接')
    } else if (err.errMsg.includes('cancel')) {
      // 用户取消，不显示错误
    } else {
      showError(defaultMsg)
    }
  } else if (err.message) {
    showError(err.message)
  } else {
    showError(defaultMsg)
  }
}

/**
 * 验证手机号（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return true
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱
 * @param {string} email - 邮箱
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 验证学号格式（字母+数字，6-20位）
 * @param {string} studentId - 学号
 * @returns {boolean}
 */
const isValidStudentId = (studentId) => {
  if (!studentId) return false
  return /^[a-zA-Z0-9]{6,20}$/.test(studentId)
}

/**
 * 验证密码强度（6-20位）
 * @param {string} password - 密码
 * @returns {boolean}
 */
const isValidPassword = (password) => {
  if (!password) return false
  return password.length >= 6 && password.length <= 20
}

/**
 * 验证字符串长度
 * @param {string} str - 输入字符串
 * @param {number} maxLen - 最大长度
 * @returns {boolean}
 */
const isValidLength = (str, maxLen = 500) => {
  if (!str) return true
  return str.length <= maxLen
}

/**
 * 清理文本输入（去除首尾空白、限制长度）
 * @param {string} str - 输入字符串
 * @param {number} maxLen - 最大长度
 * @returns {string}
 */
const sanitizeText = (str, maxLen = 500) => {
  if (!str || typeof str !== 'string') return ''
  return str.trim().substring(0, maxLen)
}

/**
 * 验证注册表单
 * @param {object} data - 注册数据
 * @returns {{ valid: boolean, message: string }}
 */
const validateRegisterForm = (data) => {
  if (!data.studentId || !data.name || !data.password) {
    return { valid: false, message: '学号、姓名和密码为必填项' }
  }
  if (!isValidStudentId(data.studentId)) {
    return { valid: false, message: '学号格式不正确（6-20位字母+数字）' }
  }
  if (!isValidPassword(data.password)) {
    return { valid: false, message: '密码长度需为6-20位' }
  }
  if (data.phone && !isValidPhone(data.phone)) {
    return { valid: false, message: '手机号格式不正确' }
  }
  if (data.email && !isValidEmail(data.email)) {
    return { valid: false, message: '邮箱格式不正确' }
  }
  return { valid: true, message: '' }
}

/**
 * 验证申请表单
 * @param {object} data - 申请数据
 * @returns {{ valid: boolean, message: string }}
 */
const validateApplicationForm = (data) => {
  if (!data.jobId) {
    return { valid: false, message: '请选择要申请的岗位' }
  }
  if (!data.reason || !data.reason.trim()) {
    return { valid: false, message: '请填写申请理由' }
  }
  if (!isValidLength(data.reason, 500)) {
    return { valid: false, message: '申请理由不能超过500字' }
  }
  if (data.phone && !isValidPhone(data.phone)) {
    return { valid: false, message: '手机号格式不正确' }
  }
  if (data.email && !isValidEmail(data.email)) {
    return { valid: false, message: '邮箱格式不正确' }
  }
  return { valid: true, message: '' }
}

module.exports = {
  formatTime,
  formatDate,
  formatCloudDate,
  formatNumber,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  request,
  callCloudFunction,
  callAuth,
  callJobs,
  callApplications,
  callSalary,
  callAdmin,
  checkLogin,
  calculateMatchScore,
  checkTimeMatch,
  getJobStatusText,
  getApplicationStatusText,
  getPayStatusText,
  debounce,
  throttle,
  handleCloudError,
  isValidPhone,
  isValidEmail,
  isValidStudentId,
  isValidPassword,
  isValidLength,
  sanitizeText,
  validateRegisterForm,
  validateApplicationForm
}
