// cloudfunctions/salary/index.js - 薪资管理云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { success, error, badRequest, unauthorized } = require('./common/response')
const { verifyUser, verifyAdmin } = require('./common/auth')
const { isValidPositiveNumber, isValidDate, sanitizeText } = require('./common/validator')

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
    case 'edit':
      return await editSalaryRecord(event)
    case 'delete':
      return await deleteSalaryRecord(event)
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

    // 查询累计薪资和总工时
    const totalResult = await db.collection('salary_records')
      .where({
        studentId: userInfo.studentId
      })
      .field({
        amount: true,
        workHours: true,
        payStatus: true
      })
      .get()

    const paidRecords = totalResult.data.filter(r => r.payStatus === 'paid')
    const totalSalary = paidRecords.reduce((sum, item) => sum + item.amount, 0)
    const totalHours = totalResult.data.reduce((sum, item) => sum + (item.workHours || 0), 0)

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
    const monthPaidRecords = monthResult.data.filter(r => r.payStatus === 'paid')
    const monthActualPay = monthPaidRecords.reduce((sum, item) => sum + item.amount, 0)
    const allPaid = monthResult.data.length > 0 && monthResult.data.every(r => r.payStatus === 'paid')

    const monthData = {
      shouldPay: monthSalary,
      actualPay: monthActualPay,
      workHours: monthHours,
      payStatus: allPaid ? 'paid' : 'unpaid',
      payStatusText: allPaid ? '已发放' : '待发放'
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
      totalHours: Math.round(totalHours * 10) / 10,
      currentJobCount: jobCountResult.total,
      monthData,
      detailList
    })
  } catch (err) {
    console.error('querySalary error:', err)
    return error(500, '查询薪资失败')
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

    // 验证数值
    const hours = parseFloat(workHours)
    const rate = parseFloat(hourlyRate)

    if (!isValidPositiveNumber(hours, 0.5, 24)) {
      return badRequest('工作时长需在0.5-24小时之间')
    }
    if (!isValidPositiveNumber(rate, 1, 500)) {
      return badRequest('时薪需在1-500元之间')
    }
    if (!isValidDate(workDate)) {
      return badRequest('日期格式不正确（YYYY-MM-DD）')
    }

    const amount = hours * rate
    const month = workDate.substring(0, 7) // 提取YYYY-MM

    const now = db.serverDate()
    await db.collection('salary_records').add({
      data: {
        studentId,
        jobId,
        jobName: sanitizeText(jobName, 100),
        workDate,
        workHours: hours,
        hourlyRate: rate,
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
    return error(500, '记录工作时长失败')
  }
}

/**
 * 计算薪资月度汇总（管理员）
 */
async function calculateSalary(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { month = '' } = event
    const targetMonth = month || getCurrentMonth()

    // 查询该月所有薪资记录
    const result = await db.collection('salary_records')
      .where({ month: targetMonth })
      .limit(100)
      .get()

    const records = result.data
    if (!records || records.length === 0) {
      return success({
        month: targetMonth,
        summary: { totalStudents: 0, totalAmount: 0, totalHours: 0, paidAmount: 0, unpaidAmount: 0 },
        students: []
      })
    }

    // 按 studentId 分组聚合
    const groups = {}
    for (const r of records) {
      const sid = r.studentId || ''
      if (!groups[sid]) {
        groups[sid] = { totalHours: 0, totalAmount: 0, recordCount: 0, paidAmount: 0, unpaidAmount: 0 }
      }
      const g = groups[sid]
      g.totalHours += r.workHours || 0
      g.totalAmount += r.amount || 0
      g.recordCount += 1
      if (r.payStatus === 'paid') {
        g.paidAmount += r.amount || 0
      } else {
        g.unpaidAmount += r.amount || 0
      }
    }

    // 查询学生信息
    const studentIds = Object.keys(groups)
    const studentList = []

    for (const sid of studentIds) {
      const g = groups[sid]
      let name = sid
      let college = ''
      try {
        const userResult = await db.collection('users')
          .where({ studentId: sid })
          .limit(1)
          .get()
        if (userResult.data.length > 0) {
          name = userResult.data[0].name || sid
          college = userResult.data[0].college || ''
        }
      } catch (e) { /* 忽略查询失败 */ }

      const allPaid = g.unpaidAmount === 0 && g.totalAmount > 0
      studentList.push({
        studentId: sid,
        name,
        college,
        totalHours: Math.round(g.totalHours * 10) / 10,
        totalAmount: Math.round(g.totalAmount * 100) / 100,
        recordCount: g.recordCount,
        payStatus: allPaid ? 'paid' : 'unpaid'
      })
    }

    // 按总金额降序
    studentList.sort((a, b) => b.totalAmount - a.totalAmount)

    const totalAmount = studentList.reduce((s, r) => s + r.totalAmount, 0)
    const totalHours = studentList.reduce((s, r) => s + r.totalHours, 0)
    const paidAmount = studentList.filter(r => r.payStatus === 'paid').reduce((s, r) => s + r.totalAmount, 0)

    return success({
      month: targetMonth,
      summary: {
        totalStudents: studentList.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalHours: Math.round(totalHours * 10) / 10,
        paidAmount: Math.round(paidAmount * 100) / 100,
        unpaidAmount: Math.round((totalAmount - paidAmount) * 100) / 100
      },
      students: studentList
    })
  } catch (err) {
    console.error('calculateSalary error:', err)
    return error(500, '计算薪资失败')
  }
}

/**
 * 编辑薪资记录（管理员）
 */
async function editSalaryRecord(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { recordId, workDate, workHours, hourlyRate, jobName, remark } = event

    if (!recordId) {
      return badRequest('缺少记录ID')
    }

    // 查询原记录
    const recordResult = await db.collection('salary_records')
      .where({ _id: recordId })
      .limit(1)
      .get()

    if (!recordResult.data || recordResult.data.length === 0) {
      return error(404, '薪资记录不存在')
    }

    const record = recordResult.data[0]

    // 已发放不允许编辑
    if (record.payStatus === 'paid') {
      return badRequest('已发放的记录不允许编辑')
    }

    // 构建更新数据（白名单）
    const updateData = {}
    if (workDate !== undefined) {
      if (!isValidDate(workDate)) return badRequest('日期格式不正确')
      updateData.workDate = workDate
      updateData.month = workDate.substring(0, 7)
    }
    if (workHours !== undefined) {
      const h = parseFloat(workHours)
      if (!isValidPositiveNumber(h, 0.5, 24)) return badRequest('工作时长需在0.5-24小时之间')
      updateData.workHours = h
    }
    if (hourlyRate !== undefined) {
      const r = parseFloat(hourlyRate)
      if (!isValidPositiveNumber(r, 1, 500)) return badRequest('时薪需在1-500元之间')
      updateData.hourlyRate = r
    }
    if (jobName !== undefined) updateData.jobName = sanitizeText(jobName, 100)
    if (remark !== undefined) updateData.remark = remark

    // 重算金额
    const finalHours = updateData.workHours || record.workHours
    const finalRate = updateData.hourlyRate || record.hourlyRate
    updateData.amount = Math.round(finalHours * finalRate * 100) / 100
    updateData.updateTime = db.serverDate()

    await db.collection('salary_records')
      .where({ _id: recordId })
      .update({ data: updateData })

    return success(null, '更新成功')
  } catch (err) {
    console.error('editSalaryRecord error:', err)
    return error(500, '更新薪资记录失败')
  }
}

/**
 * 删除薪资记录（管理员）
 */
async function deleteSalaryRecord(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { recordId } = event

    if (!recordId) {
      return badRequest('缺少记录ID')
    }

    // 查询原记录
    const recordResult = await db.collection('salary_records')
      .where({ _id: recordId })
      .limit(1)
      .get()

    if (!recordResult.data || recordResult.data.length === 0) {
      return error(404, '薪资记录不存在')
    }

    // 已发放不允许删除
    if (recordResult.data[0].payStatus === 'paid') {
      return badRequest('已发放的记录不允许删除')
    }

    await db.collection('salary_records')
      .where({ _id: recordId })
      .remove()

    return success(null, '删除成功')
  } catch (err) {
    console.error('deleteSalaryRecord error:', err)
    return error(500, '删除薪资记录失败')
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
    return error(500, '获取薪资列表失败')
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
    return error(500, '薪资发放失败')
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
