// cloudfunctions/admin/index.js - 管理员后台云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { success, error, badRequest, unauthorized } = require('./common/response')
const { verifyUser, verifyAdmin } = require('./common/auth')

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'stats':
      return await getStats(event)
    case 'studentList':
      return await getStudentList(event)
    case 'updateStudent':
      return await updateStudent(event)
    case 'exportData':
      return await exportData(event)
    case 'getNotices':
      return await getNotices(event)
    case 'publishNotice':
      return await publishNotice(event)
    case 'updateNotice':
      return await updateNotice(event)
    case 'deleteNotice':
      return await deleteNotice(event)
    default:
      return error(400, '未知的操作')
  }
}

/**
 * 获取统计数据
 */
async function getStats(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    // 岗位总数
    const jobCountResult = await db.collection('jobs').count()
    const jobCount = jobCountResult.total

    // 待审核申请数
    const pendingCountResult = await db.collection('applications')
      .where({ status: 'pending' })
      .count()
    const pendingCount = pendingCountResult.total

    // 学生总数
    const studentCountResult = await db.collection('users')
      .where({ role: 'student' })
      .count()
    const studentCount = studentCountResult.total

    // 本月薪资发放
    const currentMonth = getCurrentMonth()
    const salaryResult = await db.collection('salary_records')
      .where({
        month: currentMonth,
        payStatus: 'paid'
      })
      .field({ amount: true })
      .limit(1000)
      .get()

    const totalSalary = salaryResult.data.reduce((sum, item) => sum + item.amount, 0)

    return success({
      jobCount,
      pendingCount,
      studentCount,
      totalSalary
    })
  } catch (err) {
    console.error('getStats error:', err)
    return error(500, '获取统计数据失败')
  }
}

/**
 * 转义正则特殊字符，防止正则注入
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 获取学生列表（管理员）
 */
async function getStudentList(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { keyword = '', pageNum = 1, pageSize = 20 } = event

    // 限制分页大小
    const safePageSize = Math.min(Math.max(parseInt(pageSize) || 20, 1), 50)
    const safePageNum = Math.max(parseInt(pageNum) || 1, 1)

    let whereCondition = {
      role: 'student'
    }

    if (keyword) {
      const safeKeyword = escapeRegExp(keyword)
      whereCondition.$or = [
        { studentId: db.RegExp({ regexp: safeKeyword, options: 'i' }) },
        { name: db.RegExp({ regexp: safeKeyword, options: 'i' }) },
        { major: db.RegExp({ regexp: safeKeyword, options: 'i' }) }
      ]
    }

    const countResult = await db.collection('users')
      .where(whereCondition)
      .count()

    const result = await db.collection('users')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((safePageNum - 1) * safePageSize)
      .limit(safePageSize)
      .field({
        password: false,
        openid: false
      })
      .get()

    return success({
      total: countResult.total,
      list: result.data
    })
  } catch (err) {
    console.error('getStudentList error:', err)
    return error(500, '获取学生列表失败')
  }
}

/**
 * 更新学生信息（管理员）- 使用字段白名单
 */
async function updateStudent(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { userId } = event

    if (!userId) {
      return error(400, '用户ID不能为空')
    }

    // 使用白名单，只允许更新安全字段
    const allowedFields = [
      'name', 'gender', 'college', 'major', 'grade',
      'phone', 'email', 'familyType', 'familyDesc',
      'gpa', 'freeTime', 'skills', 'experience', 'status'
    ]

    const updateData = {}
    for (const key of allowedFields) {
      if (event[key] !== undefined) {
        updateData[key] = event[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return error(400, '没有需要更新的字段')
    }

    updateData.updateTime = db.serverDate()

    await db.collection('users')
      .where({ userId })
      .update({
        data: updateData
      })

    return success(null, '更新成功')
  } catch (err) {
    console.error('updateStudent error:', err)
    return error(500, '更新失败')
  }
}

/**
 * 导出数据（管理员）
 */
async function exportData(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { type = 'applications' } = event

    let data = []

    if (type === 'applications') {
      // 导出申请记录
      const result = await db.collection('applications')
        .orderBy('applyTime', 'desc')
        .limit(1000)
        .get()
      data = result.data
    } else if (type === 'students') {
      // 导出学生信息
      const result = await db.collection('users')
        .where({ role: 'student' })
        .field({ password: false, openid: false })
        .limit(1000)
        .get()
      data = result.data
    } else if (type === 'salary') {
      // 导出薪资记录
      const result = await db.collection('salary_records')
        .orderBy('createTime', 'desc')
        .limit(1000)
        .get()
      data = result.data
    }

    return success({
      type,
      count: data.length,
      data
    })
  } catch (err) {
    console.error('exportData error:', err)
    return error(500, '导出数据失败')
  }
}

/**
 * 获取当前月份 YYYY-MM
 */
function getCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 获取公告列表（公开接口）
 */
async function getNotices(event) {
  try {
    const result = await db.collection('notices')
      .orderBy('publishDate', 'desc')
      .limit(20)
      .get()
    return success({ list: result.data })
  } catch (err) {
    // notices 集合可能不存在，返回空列表而非报错
    console.error('getNotices error (可能集合未创建):', err)
    return success({ list: [] })
  }
}

/**
 * 发布公告（管理员）
 */
async function publishNotice(event) {
  try {
    const userInfo = await verifyUser(event)
    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }
    const { title, content } = event
    if (!title || !content) {
      return badRequest('标题和内容不能为空')
    }
    const now = db.serverDate()
    const result = await db.collection('notices').add({
      data: {
        title: title.substring(0, 100),
        content: content.substring(0, 500),
        publishDate: now,
        publisher: userInfo.name || userInfo.userId
      }
    })
    return success({ noticeId: result._id }, '公告发布成功')
  } catch (err) {
    console.error('publishNotice error:', err)
    return error(500, '发布公告失败')
  }
}

/**
 * 更新公告（管理员）
 */
async function updateNotice(event) {
  try {
    const userInfo = await verifyUser(event)
    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }
    const { noticeId, title, content } = event
    if (!noticeId) return badRequest('公告ID不能为空')
    const updateData = {}
    if (title) updateData.title = title.substring(0, 100)
    if (content) updateData.content = content.substring(0, 500)
    if (Object.keys(updateData).length === 0) return badRequest('没有可更新的字段')
    await db.collection('notices').doc(noticeId).update({ data: updateData })
    return success(null, '公告更新成功')
  } catch (err) {
    console.error('updateNotice error:', err)
    return error(500, '更新公告失败')
  }
}

/**
 * 删除公告（管理员）
 */
async function deleteNotice(event) {
  try {
    const userInfo = await verifyUser(event)
    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }
    const { noticeId } = event
    if (!noticeId) return badRequest('公告ID不能为空')
    await db.collection('notices').doc(noticeId).remove()
    return success(null, '公告删除成功')
  } catch (err) {
    console.error('deleteNotice error:', err)
    return error(500, '删除公告失败')
  }
}
