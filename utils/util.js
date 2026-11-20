// utils/util.js


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
 * 验证密码强度（6-20位）
 * @param {string} password - 密码
 * @returns {boolean}
 */
const isValidPassword = (password) => {
  if (!password) return false
  return password.length >= 6 && password.length <= 20
}





module.exports = {
  formatDate,
  formatCloudDate,
  formatNumber,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  callCloudFunction,
  callAuth,
  callJobs,
  callApplications,
  callSalary,
  callAdmin,
  checkLogin,
  getJobStatusText,
  getApplicationStatusText,
  getPayStatusText,
  debounce,
  handleCloudError,
  isValidPhone,
  isValidEmail,
  isValidPassword,
}
