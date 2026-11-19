// cloud/common/auth.js - 云函数认证中间件

const cloud = require('wx-server-sdk')
const crypto = require('crypto')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// JWT 密钥（与 QGPY 保持一致，生产环境请从环境变量获取）
const JWT_SECRET = (() => {
  const s = process.env.JWT_SECRET
  if (s) return s
  const isProd = process.env.NODE_ENV === 'production' || process.env.QG_ENV === 'production'
  if (isProd) throw new Error('[auth] 生产环境未配置 JWT_SECRET，拒绝启动。请在云函数环境变量中设置强密钥。')
  console.warn('[auth][安全] JWT_SECRET 未配置，使用开发默认密钥，生产环境请设置 JWT_SECRET。')
  return 'qgcloud-jwt-secret-2026'
})()
const TOKEN_EXPIRE_HOURS = 24

/**
 * 验证用户登录状态
 * 优先通过 openid 查找，找不到时通过 token 回退验证
 * @param {Object} event - 云函数事件对象
 * @returns {Object|null} 用户信息或null
 */
const verifyUser = async (event) => {
  try {
    // 获取微信用户openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    if (openid) {
      // 优先通过 openid 查询
      const userResult = await db.collection('users').where({
        openid: openid
      }).get()

      if (userResult.data.length > 0) {
        return userResult.data[0]
      }
    }

    // openid 查找失败，尝试通过 token 回退（解决管理员 openid 为空的问题）
    if (event && event.token) {
      const payload = verifyToken(event.token)
      if (payload && payload.userId) {
        const userResult = await db.collection('users').where({
          userId: payload.userId
        }).get()

        if (userResult.data.length > 0) {
          // 补写 openid，下次直接通过 openid 查找
          if (openid) {
            await db.collection('users').doc(userResult.data[0]._id).update({
              data: { openid: openid }
            }).catch(() => {})
          }
          return userResult.data[0]
        }
      }
    }

    return null
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
 * 生成带签名和过期时间的token
 * 格式: base64(payload).signature
 * @param {Object} userInfo - 用户信息
 * @returns {string} token
 */
const generateToken = (userInfo) => {
  const payload = {
    userId: userInfo.userId,
    role: userInfo.role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRE_HOURS * 60 * 60 * 1000
  }
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payloadStr)
    .digest('hex')
  return `${payloadStr}.${signature}`
}

/**
 * 验证token的有效性
 * @param {string} token - token字符串
 * @returns {Object|null} 解析后的payload或null（无效/过期）
 */
const verifyToken = (token) => {
  try {
    if (!token || !token.includes('.')) return null

    const [payloadStr, signature] = token.split('.')
    if (!payloadStr || !signature) return null

    // 验证签名
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(payloadStr)
      .digest('hex')

    if (signature !== expectedSig) return null

    // 解析payload
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString())

    // 检查过期时间
    if (payload.exp && Date.now() > payload.exp) {
      return null
    }

    return payload
  } catch (err) {
    console.error('verifyToken error:', err)
    return null
  }
}

module.exports = {
  verifyUser,
  verifyAdmin,
  generateToken,
  verifyToken
}
