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
    case 'getOptions':
      return await getOptions(event)
    case 'setUserRole':
      return await setUserRole(event)
    case 'statsDetail':
      return await getStatsDetail(event)
    case 'getLogs':
      return await getLogs(event)
    case 'backupData':
      return await backupData(event)
    case 'updateOptions':
      return await updateOptions(event)
    default:
      return error(400, '未知的操作')
  }
}

/**
 * 获取选项库（学院/专业/技能）
 */
async function getOptions(event) {
  const userInfo = await verifyUser(event)
  if (!userInfo || !verifyAdmin(userInfo)) return unauthorized('需要管理员权限')
  try {
    const res = await db.collection('system_options').doc('study').get()
    const doc = res.data && res.data[0]
    if (doc) return success(doc)
    return success({ colleges: [], majors: {}, skills: [] })
  } catch (err) {
    console.error('getOptions error:', err)
    return error(500, '获取选项失败')
  }
}

/**
 * 更新选项库（学院/专业/技能）
 */
async function updateOptions(event) {
  const userInfo = await verifyUser(event)
  if (!userInfo || !verifyAdmin(userInfo)) return unauthorized('需要管理员权限')
  const { colleges, majors, skills } = event || {}
  if (!Array.isArray(colleges) || !Array.isArray(skills) || typeof majors !== 'object' || majors === null) {
    return badRequest('选项格式不正确')
  }
  const data = { colleges, majors, skills, updatedBy: userInfo.userId || 'admin', updateTime: db.serverDate() }
  try {
    await db.collection('system_options').doc('study').set({ data })
  } catch (err) {
    await db.collection('system_options').add({ data: { _id: 'study', ...data } })
  }
  return success(null, '选项已更新')
}

/**
 * 数据统计详情（图表数据）
 */
async function getStatsDetail(event) {
  const userInfo = await verifyUser(event)
  if (!userInfo || !verifyAdmin(userInfo)) return unauthorized('需要管理员权限')
  try {
    const jobs = await db.collection('jobs').field({ status: true, jobCategory: true }).limit(1000).get()
    const jobByStatus = { recruiting: 0, full: 0, closed: 0 }
    const jobByCategory = {}
    jobs.data.forEach(j => {
      jobByStatus[j.status] = (jobByStatus[j.status] || 0) + 1
      const c = j.jobCategory || '未分类'
      jobByCategory[c] = (jobByCategory[c] || 0) + 1
    })

    const apps = await db.collection('applications').field({ status: true }).limit(2000).get()
    const appByStatus = { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
    apps.data.forEach(a => { appByStatus[a.status] = (appByStatus[a.status] || 0) + 1 })

    const sals = await db.collection('salary_records').field({ workHours: true, amount: true, month: true }).limit(2000).get()
    let totalHours = 0, totalSalary = 0
    const salaryByMonth = {}
    sals.data.forEach(s => {
      totalHours += s.workHours || 0
      totalSalary += s.amount || 0
      const m = s.month || '未知'
      salaryByMonth[m] = (salaryByMonth[m] || 0) + (s.amount || 0)
    })
    const avgHours = apps.data.length ? Math.round((totalHours / apps.data.length) * 10) / 10 : 0

    return success({
      jobByStatus, jobByCategory, appByStatus,
      jobTotal: jobs.data.length, appTotal: apps.data.length,
      totalHours: Math.round(totalHours * 10) / 10,
      totalSalary: Math.round(totalSalary * 10) / 10,
      avgHours, salaryByMonth
    })
  } catch (err) {
    console.error('getStatsDetail error:', err)
    return error(500, '获取统计详情失败')
  }
}

/**
 * 设置用户角色（管理员）
 */
async function setUserRole(event) {
  const userInfo = await verifyUser(event)
  if (!userInfo || !verifyAdmin(userInfo)) return unauthorized('需要管理员权限')
  const { userId, role } = event
  if (!userId || (role !== 'student' && role !== 'admin')) return badRequest('参数错误')
  const target = await db.collection('users').where({ userId }).get()
  if (!target.data || target.data.length === 0) return error(404, '用户不存在')
  await db.collection('users').where({ userId }).update({ data: { role, updateTime: db.serverDate() } })
  await addLog(userInfo.userId || 'admin', 'student', '调整用户角色', { userId, role })
  return success(null, '角色已更新')
}

/**
 * 查询系统日志（管理员）
 */
async function getLogs(event) {
  const userInfo = await verifyUser(event)
  if (!userInfo || !verifyAdmin(userInfo)) return unauthorized('需要管理员权限')
  const { pageNum = 1, pageSize = 20, type = '', keyword = '' } = event
  const size = Math.min(Math.max(parseInt(pageSize) || 20, 1), 50)
  const page = Math.max(parseInt(pageNum) || 1, 1)
  let where = {}
  if (type) where.type = type
  if (keyword) where.action = db.RegExp({ regexp: escapeRegExp(keyword), options: 'i' })
  try {
    const count = await db.collection('system_logs').where(where).count()
    const res = await db.collection('system_logs').where(where)
      .orderBy('createTime', 'desc').skip((page - 1) * size).limit(size).get()
    return success({ total: count.total, list: res.data })
  } catch (err) {
    console.error('getLogs error:', err)
    return error(500, '查询日志失败')
  }
}

/**
 * 数据备份（管理员）：导出各集合数据到云存储
 */
async function backupData(event) {
  const userInfo = await verifyUser(event)
  if (!userInfo || !verifyAdmin(userInfo)) return unauthorized('需要管理员权限')
  const collections = ['users', 'jobs', 'applications', 'salary_records', 'notices']
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes())
  try {
    const data = {}
    const summary = {}
    for (const c of collections) {
      const r = await db.collection(c).field({ password: false, openid: false }).limit(1000).get()
      data[c] = r.data
      summary[c] = r.data.length
    }
    let fileID = ''
    try {
      const up = await cloud.uploadFile({
        cloudPath: 'backups/backup-' + stamp + '.json',
        fileContent: Buffer.from(JSON.stringify({ backupTime: now.toISOString(), collections: data }))
      })
      fileID = up.fileID || ''
    } catch (upErr) {
      console.warn('备份上传云存储失败:', upErr.message)
    }
    return success({ fileID, summary, backupTime: now.toISOString() }, '备份已生成')
  } catch (err) {
    console.error('backupData error:', err)
    return error(500, '备份失败')
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
      'gpa', 'freeTime', 'skills', 'experience', 'preferredJobTypes', 'courses', 'status'
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

    await addLog(userInfo.userId || 'admin', 'student', '更新学生信息', { userId, fields: Object.keys(updateData) })
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
