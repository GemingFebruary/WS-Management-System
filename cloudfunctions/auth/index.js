// cloudfunctions/auth/index.js - 用户认证云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const bcrypt = require('bcryptjs')

const { success, error, badRequest } = require('./common/response')
const { verifyUser, generateToken } = require('./common/auth')
const { isValidStudentId, isValidPassword, isValidPhone, isValidEmail, sanitizeText } = require('./common/validator')

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'login':
      return await login(event)
    case 'register':
      return await register(event)
    case 'logout':
      return await logout(event)
    case 'getUserInfo':
      return await getUserInfo(event)
    case 'updateProfile':
      return await updateProfile(event)
    default:
      return error(400, '未知的操作')
  }
}

/**
 * 用户登录
 */
async function login(event) {
  try {
    const { account, password, role = 'student' } = event

    if (!account || !password) {
      return badRequest('账号和密码不能为空')
    }

    // 查询用户
    let userResult
    if (role === 'admin') {
      // 管理员登录：通过userId精确匹配
      userResult = await db.collection('users').where({
        userId: account,
        role: 'admin'
      }).get()
    } else {
      // 学生登录：支持用学号或userId登录
      // 先精确匹配userId
      userResult = await db.collection('users').where({
        userId: account,
        role: 'student'
      }).get()

      // 如果userId没匹配到，再用studentId匹配
      if (userResult.data.length === 0) {
        userResult = await db.collection('users').where({
          studentId: account,
          role: 'student'
        }).get()
      }
    }

    if (userResult.data.length === 0) {
      return error(401, '账号不存在，请先注册')
    }

    const user = userResult.data[0]

    // 检查用户状态
    if (user.status === 'disabled') {
      return error(403, '账号已被禁用，请联系管理员')
    }

    // 验证密码
    // 兼容处理：数据库中可能存储的是bcrypt哈希，也可能是明文（旧数据）
    let passwordValid = false
    if (user.password && user.password.startsWith('$2')) {
      // bcrypt哈希格式，使用bcrypt.compare
      passwordValid = await bcrypt.compare(password, user.password)
    } else {
      // 明文密码直接比对（兼容旧数据）
      passwordValid = (password === user.password)
    }

    if (!passwordValid) {
      return error(401, '密码错误')
    }

    // 如果密码是明文存储的旧数据，自动升级为bcrypt哈希
    if (user.password && !user.password.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await db.collection('users').doc(user._id).update({
        data: {
          password: hashedPassword
        }
      })
    }

    // 生成token
    const token = generateToken(user)

    // 获取微信openid，登录时同步写入用户记录（解决管理员账号openid为空的问题）
    const wxContext = cloud.getWXContext()
    const wxOpenid = wxContext.OPENID

    // 更新最后登录时间 + openid
    const updateData = { lastLoginTime: db.serverDate() }
    if (wxOpenid && (!user.openid || user.openid !== wxOpenid)) {
      updateData.openid = wxOpenid
    }
    await db.collection('users').doc(user._id).update({ data: updateData })

    // 返回用户信息（不包含密码）
    const userInfo = {
      userId: user.userId,
      name: user.name,
      studentId: user.studentId,
      role: user.role,
      major: user.major,
      grade: user.grade,
      phone: user.phone,
      email: user.email,
      college: user.college,
      gender: user.gender,
      familyType: user.familyType,
      familyDesc: user.familyDesc
    }

    await addLog(userInfo.userId || account, 'login', '用户登录', { account })
    return success({
      token,
      userInfo
    }, '登录成功')
  } catch (err) {
    console.error('login error:', err)
    return error(500, '登录失败')
  }
}

/**
 * 学生注册
 */
async function register(event) {
  try {
    const {
      studentId,
      name,
      gender,
      college,
      major,
      grade,
      phone,
      email,
      familyType,
      familyDesc,
      password
    } = event

    // 参数验证
    if (!studentId || !name || !password) {
      return badRequest('学号、姓名和密码为必填项')
    }

    if (!isValidStudentId(studentId)) {
      return badRequest('学号格式不正确（6-20位字母+数字）')
    }

    if (!isValidPassword(password)) {
      return badRequest('密码长度为6-20位')
    }

    if (phone && !isValidPhone(phone)) {
      return badRequest('手机号格式不正确')
    }

    if (email && !isValidEmail(email)) {
      return badRequest('邮箱格式不正确')
    }

    // 文本字段清理
    const safeName = sanitizeText(name, 50)
    const safeCollege = sanitizeText(college, 100)
    const safeMajor = sanitizeText(major, 100)
    const safeFamilyDesc = sanitizeText(familyDesc, 500)

    // 检查学号是否已存在
    const existResult = await db.collection('users').where({
      studentId: studentId
    }).get()

    if (existResult.data.length > 0) {
      return error(400, '该学号已注册')
    }

    // 同时检查userId是否重复（防止与管理员userId冲突）
    const userIdExist = await db.collection('users').where({
      userId: studentId
    }).get()

    if (userIdExist.data.length > 0) {
      return error(400, '该学号已注册')
    }

    // 获取微信openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const now = db.serverDate()
    const result = await db.collection('users').add({
      data: {
        userId: studentId,
        studentId,
        name: safeName,
        gender: gender || '',
        college: safeCollege,
        major: safeMajor,
        grade: grade || '',
        phone: phone || '',
        email: email || '',
        familyType: familyType || '一般',
        familyDesc: safeFamilyDesc,
        password: hashedPassword,
        role: 'student',
        openid: openid || '',
        status: 'active',
        createTime: now,
        updateTime: now,
        lastLoginTime: now
      }
    })

    return success({
      userId: studentId
    }, '注册成功')
  } catch (err) {
    console.error('register error:', err)
    return error(500, '注册失败')
  }
}

/**
 * 用户登出
 */
async function logout(event) {
  try {
    const userInfo = await verifyUser(event)
    if (!userInfo) {
      return error(401, '未登录')
    }

    // 这里可以添加token黑名单逻辑
    return success(null, '登出成功')
  } catch (err) {
    console.error('logout error:', err)
    return error(500, '登出失败')
  }
}

/**
 * 获取用户信息
 */
async function getUserInfo(event) {
  try {
    const userInfo = await verifyUser(event)
    if (!userInfo) {
      return error(401, '未登录')
    }

    // 返回用户信息（不包含密码和openid）
    const safeUserInfo = {
      userId: userInfo.userId,
      name: userInfo.name,
      studentId: userInfo.studentId,
      role: userInfo.role,
      major: userInfo.major,
      grade: userInfo.grade,
      phone: userInfo.phone,
      email: userInfo.email,
      college: userInfo.college,
      gender: userInfo.gender,
      familyType: userInfo.familyType,
      familyDesc: userInfo.familyDesc,
      gpa: userInfo.gpa,
      freeTime: userInfo.freeTime,
      skills: userInfo.skills,
      experience: userInfo.experience,
      preferredJobTypes: userInfo.preferredJobTypes || [],
      courses: userInfo.courses || ''
    }

    return success(safeUserInfo)
  } catch (err) {
    console.error('getUserInfo error:', err)
    return error(500, '获取用户信息失败')
  }
}

/**
 * 更新个人资料（学生本人维护匹配画像）
 */
async function updateProfile(event) {
  try {
    const userInfo = await verifyUser(event)
    if (!userInfo) {
      return error(401, '未登录')
    }

    const allowedFields = [
      'name', 'gender', 'college', 'major', 'grade', 'phone', 'email',
      'gpa', 'freeTime', 'skills', 'preferredJobTypes', 'courses',
      'experience', 'familyType', 'familyDesc'
    ]
    const updateData = {}
    for (const key of allowedFields) {
      if (event[key] !== undefined) updateData[key] = event[key]
    }
    if (Object.keys(updateData).length === 0) {
      return error(400, '没有需要更新的字段')
    }

    // 输入校验
    if (updateData.phone !== undefined && updateData.phone !== '' && !isValidPhone(updateData.phone)) {
      return badRequest('手机号格式不正确')
    }
    if (updateData.email !== undefined && updateData.email !== '' && !isValidEmail(updateData.email)) {
      return badRequest('邮箱格式不正确')
    }
    if (updateData.gpa !== undefined) {
      const g = Number(updateData.gpa)
      if (!Number.isFinite(g) || g < 0 || g > 4) {
        return badRequest('GPA 需在 0-4 之间')
      }
      updateData.gpa = g
    }
    if (updateData.preferredJobTypes !== undefined && !Array.isArray(updateData.preferredJobTypes)) {
      return badRequest('岗位类型偏好格式不正确')
    }
    if (updateData.name !== undefined) {
      updateData.name = sanitizeText(String(updateData.name)).trim()
      if (!updateData.name) return badRequest('姓名不能为空')
    }

    updateData.updateTime = db.serverDate()
    await db.collection('users').where({ userId: userInfo.userId }).update({ data: updateData })
    return success(null, '更新成功')
  } catch (err) {
    console.error('updateProfile error:', err)
    return error(500, '更新失败')
  }
}

/**
 * 写入系统日志（失败不阻断主流程）
 */
async function addLog(userId, type, action, details) {
  try {
    await db.collection('system_logs').add({
      data: { type, userId, action, details: details || null, createTime: db.serverDate() }
    })
  } catch (e) {
    console.warn('写日志失败:', e.message)
  }
}
