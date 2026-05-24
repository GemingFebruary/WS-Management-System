// cloud/common/auth.js - 云函数认证中间件

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 验证用户登录状态
 * @param {Object} event - 云函数事件对象
 * @returns {Object|null} 用户信息或null
 */
const verifyUser = async (event) => {
  try {
    // 获取微信用户openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    if (!openid) {
      return null
    }

    // 查询用户信息
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return null
    }

    return userResult.data[0]
  } catch (err) {
    console.error('verifyUser error:', err)
    return null
  }
}

/**
 * 验证管理员权限
 * @param {Object} userInfo - 用户信息
 * @returns {boolean} 是否为管理员
 */
const verifyAdmin = (userInfo) => {
  return userInfo && userInfo.role === 'admin'
}

/**
 * 生成简单的token（实际生产环境建议使用JWT）
 * @param {Object} userInfo - 用户信息
 * @returns {string} token
 */
const generateToken = (userInfo) => {
  const timestamp = Date.now()
  const tokenStr = `${userInfo.userId}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
  return Buffer.from(tokenStr).toString('base64')
}

module.exports = {
  verifyUser,
  verifyAdmin,
  generateToken
}
