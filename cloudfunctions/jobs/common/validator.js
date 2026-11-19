// cloud/common/validator.js - 云函数输入验证工具

/**
 * 转义正则特殊字符，防止正则注入
 * @param {string} str - 输入字符串
 * @returns {string} 转义后的字符串
 */
const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 验证手机号（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return true // 可选字段，空值视为有效
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱
 * @param {string} email - 邮箱
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email) return true // 可选字段，空值视为有效
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
 * 验证密码强度（6-20位，至少包含字母和数字）
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
 * 验证正整数
 * @param {any} val - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean}
 */
const isValidPositiveInt = (val, min = 0, max = Infinity) => {
  const num = parseInt(val)
  return !isNaN(num) && num >= min && num <= max && Number.isInteger(num)
}

/**
 * 验证正数（含小数）
 * @param {any} val - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean}
 */
const isValidPositiveNumber = (val, min = 0, max = Infinity) => {
  const num = parseFloat(val)
  return !isNaN(num) && num >= min && num <= max
}

/**
 * 验证日期格式 YYYY-MM-DD
 * @param {string} dateStr - 日期字符串
 * @returns {boolean}
 */
const isValidDate = (dateStr) => {
  if (!dateStr) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
}

/**
 * 验证月份格式 YYYY-MM
 * @param {string} monthStr - 月份字符串
 * @returns {boolean}
 */
const isValidMonth = (monthStr) => {
  if (!monthStr) return false
  return /^\d{4}-\d{2}$/.test(monthStr)
}

/**
 * 验证岗位状态
 * @param {string} status - 状态值
 * @returns {boolean}
 */
const isValidJobStatus = (status) => {
  return ['recruiting', 'full', 'closed'].includes(status)
}

/**
 * 验证申请状态
 * @param {string} status - 状态值
 * @returns {boolean}
 */
const isValidApplicationStatus = (status) => {
  return ['pending', 'approved', 'rejected', 'cancelled'].includes(status)
}

/**
 * 验证分页参数
 * @param {any} pageNum - 页码
 * @param {any} pageSize - 每页数量
 * @param {number} maxPageSize - 最大每页数量
 * @returns {{ pageNum: number, pageSize: number }} 安全的分页参数
 */
const validatePagination = (pageNum, pageSize, maxPageSize = 50) => {
  return {
    pageNum: Math.max(parseInt(pageNum) || 1, 1),
    pageSize: Math.min(Math.max(parseInt(pageSize) || 10, 1), maxPageSize)
  }
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

module.exports = {
  escapeRegExp,
  isValidPhone,
  isValidEmail,
  isValidStudentId,
  isValidPassword,
  isValidLength,
  isValidPositiveInt,
  isValidPositiveNumber,
  isValidDate,
  isValidMonth,
  isValidJobStatus,
  isValidApplicationStatus,
  validatePagination,
  sanitizeText
}
