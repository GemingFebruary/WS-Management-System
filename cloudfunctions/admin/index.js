// cloudfunctions/admin/index.js - 管理员后台云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { success, error, unauthorized } = require('./common/response')
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
    return error(500, '获取统计数据失败: ' + err.message)
  }
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

    let whereCondition = {
      role: 'student'
    }

    if (keyword) {
      whereCondition.$or = [
        { studentId: db.RegExp({ regexp: keyword, options: 'i' }) },
        { name: db.RegExp({ regexp: keyword, options: 'i' }) },
        { major: db.RegExp({ regexp: keyword, options: 'i' }) }
      ]
    }

    const countResult = await db.collection('users')
      .where(whereCondition)
      .count()

    const result = await db.collection('users')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
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
    return error(500, '获取学生列表失败: ' + err.message)
  }
}

/**
 * 更新学生信息（管理员）
 */
async function updateStudent(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { userId, ...updateData } = event

    if (!userId) {
      return error(400, '用户ID不能为空')
    }

    // 移除不允许更新的字段
    delete updateData._id
    delete updateData.password
    delete updateData.openid
    delete updateData.createTime

    updateData.updateTime = db.serverDate()

    await db.collection('users')
      .where({ userId })
      .update({
        data: updateData
      })

    return success(null, '更新成功')
  } catch (err) {
    console.error('updateStudent error:', err)
    return error(500, '更新失败: ' + err.message)
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
        .get()
      data = result.data
    } else if (type === 'students') {
      // 导出学生信息
      const result = await db.collection('users')
        .where({ role: 'student' })
        .field({ password: false, openid: false })
        .get()
      data = result.data
    } else if (type === 'salary') {
      // 导出薪资记录
      const result = await db.collection('salary_records')
        .orderBy('createTime', 'desc')
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
    return error(500, '导出数据失败: ' + err.message)
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
