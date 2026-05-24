// cloudfunctions/salary/index.js - 薪资管理云函数

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
    case 'query':
      return await querySalary(event)
    case 'record':
      return await recordWorkHours(event)
    case 'calculate':
      return await calculateSalary(event)
    case 'list':
      return await getSalaryList(event)
    case 'adminPay':
      return await processPayment(event)
    default:
      return error(400, '未知的操作')
  }
}

/**
 * 查询薪资信息
 */
async function querySalary(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || userInfo.role !== 'student') {
      return unauthorized('请先以学生身份登录')
    }

    const { month = '' } = event

    // 获取当前月份格式 YYYY-MM
    const currentMonth = month || getCurrentMonth()

    // 查询累计薪资
    const totalResult = await db.collection('salary_records')
      .where({
        studentId: userInfo.studentId,
        payStatus: 'paid'
      })
      .field({
        amount: true
      })
      .get()

    const totalSalary = totalResult.data.reduce((sum, item) => sum + item.amount, 0)

    // 查询当月薪资
    const monthResult = await db.collection('salary_records')
      .where({
        studentId: userInfo.studentId,
        month: currentMonth
      })
      .get()

    const monthSalary = monthResult.data.reduce((sum, item) => sum + item.amount, 0)
    const monthHours = monthResult.data.reduce((sum, item) => sum + item.workHours, 0)

    // 查询当前在岗岗位数
    const jobCountResult = await db.collection('applications')
      .where({
        studentId: userInfo.studentId,
        status: 'approved'
      })
      .count()

    // 构建当月数据
    const monthData = {
      shouldPay: monthSalary,
      actualPay: monthSalary,
      workHours: monthHours,
      payStatus: monthSalary > 0 ? 'paid' : 'unpaid',
      payStatusText: monthSalary > 0 ? '已发放' : '未发放'
    }

    // 获取薪资明细列表
    const detailList = monthResult.data.map(item => ({
      recordId: item._id,
      jobName: item.jobName,
      workDate: item.workDate,
      workHours: item.workHours,
      hourlyRate: item.hourlyRate,
      amount: item.amount,
      payStatus: item.payStatus,
      payDate: item.payDate
    }))

    return success({
      totalSalary,
      monthSalary,
      totalHours: 0, // 可以后续扩展统计总工时
      currentJobCount: jobCountResult.total,
      monthData,
      detailList
    })
  } catch (err) {
    console.error('querySalary error:', err)
    return error(500, '查询薪资失败: ' + err.message)
  }
}

/**
 * 记录工作时长（管理员）
 */
async function recordWorkHours(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const {
      studentId,
      jobId,
      jobName,
      workDate,
      workHours,
      hourlyRate
    } = event

    if (!studentId || !jobId || !workDate || !workHours || !hourlyRate) {
      return badRequest('缺少必要参数')
    }

    const amount = parseFloat(workHours) * parseFloat(hourlyRate)
    const month = workDate.substring(0, 7) // 提取YYYY-MM

    const now = db.serverDate()
    await db.collection('salary_records').add({
      data: {
        studentId,
        jobId,
        jobName: jobName || '',
        workDate,
        workHours: parseFloat(workHours),
        hourlyRate: parseFloat(hourlyRate),
        amount,
        month,
        payStatus: 'unpaid',
        createTime: now,
        createdBy: userInfo.userId
      }
    })

    return success(null, '工作时长记录成功')
  } catch (err) {
    console.error('recordWorkHours error:', err)
    return error(500, '记录工作时长失败: ' + err.message)
  }
}

/**
 * 计算薪资（管理员批量计算）
 */
async function calculateSalary(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { month = '' } = event
    const targetMonth = month || getCurrentMonth()

    // 这里可以实现更复杂的薪资计算逻辑
    // 例如根据岗位类型、工作难度等因素调整时薪

    return success({
      message: `已计算${targetMonth}月份薪资`
    })
  } catch (err) {
    console.error('calculateSalary error:', err)
    return error(500, '计算薪资失败: ' + err.message)
  }
}

/**
 * 获取薪资列表（管理员）
 */
async function getSalaryList(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { month = '', studentId = '', pageNum = 1, pageSize = 20 } = event

    let whereCondition = {}

    if (month) {
      whereCondition.month = month
    }

    if (studentId) {
      whereCondition.studentId = studentId
    }

    const countResult = await db.collection('salary_records')
      .where(whereCondition)
      .count()

    const result = await db.collection('salary_records')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get()

    return success({
      total: countResult.total,
      list: result.data
    })
  } catch (err) {
    console.error('getSalaryList error:', err)
    return error(500, '获取薪资列表失败: ' + err.message)
  }
}

/**
 * 处理发放（管理员）
 */
async function processPayment(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { recordIds, month = '' } = event

    if (!recordIds && !month) {
      return badRequest('请提供记录ID或月份')
    }

    const now = db.serverDate()
    const payDate = new Date().toISOString().split('T')[0]

    let updateCondition = {}

    if (recordIds && recordIds.length > 0) {
      updateCondition._id = _.in(recordIds)
    } else if (month) {
      updateCondition = {
        month,
        payStatus: 'unpaid'
      }
    }

    await db.collection('salary_records')
      .where(updateCondition)
      .update({
        data: {
          payStatus: 'paid',
          payDate,
          updateTime: now
        }
      })

    return success(null, '薪资发放成功')
  } catch (err) {
    console.error('processPayment error:', err)
    return error(500, '薪资发放失败: ' + err.message)
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
