// cloudfunctions/applications/index.js - 申请管理云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const { success, error, badRequest, unauthorized } = require('./common/response')
const { verifyUser, verifyAdmin } = require('./common/auth')
const { isValidPhone, isValidEmail, isValidLength, sanitizeText } = require('./common/validator')

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'submit':
      return await submitApplication(event)
    case 'myApplications':
      return await getMyApplications(event)
    case 'detail':
      return await getApplicationDetail(event)
    case 'review':
      return await reviewApplication(event)
    case 'batchReview':
      return await batchReviewApplication(event)
    case 'adminList':
      return await getAdminApplicationList(event)
    case 'cancel':
      return await cancelApplication(event)
    default:
      return error(400, '未知的操作')
  }
}

/**
 * 提交申请
 */
async function submitApplication(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || userInfo.role !== 'student') {
      return unauthorized('请先以学生身份登录')
    }

    const {
      jobId,
      phone,
      email,
      availableTime,
      experience,
      reason,
      attachments = []
    } = event

    if (!jobId || !reason) {
      return badRequest('岗位ID和申请理由为必填项')
    }

    // 验证输入
    if (!isValidLength(reason, 500)) {
      return badRequest('申请理由不能超过500字')
    }
    if (phone && !isValidPhone(phone)) {
      return badRequest('手机号格式不正确')
    }
    if (email && !isValidEmail(email)) {
      return badRequest('邮箱格式不正确')
    }

    // 文本清理
    const safeReason = sanitizeText(reason, 500)
    const safeExperience = sanitizeText(experience, 500)
    const safeAvailableTime = sanitizeText(availableTime, 100)

    // 检查岗位是否存在
    const jobResult = await db.collection('jobs').doc(jobId).get()
    if (!jobResult.data) {
      return error(404, '岗位不存在')
    }

    const job = jobResult.data

    // 检查岗位是否还在招聘
    if (job.status !== 'recruiting') {
      return error(400, '该岗位已停止招聘')
    }

    // 检查是否已经申请过（仅检查待审核和已通过的记录，允许被驳回后重新申请）
    const existResult = await db.collection('applications').where({
      studentId: userInfo.studentId,
      jobId: jobId,
      status: _.in(['pending', 'approved'])
    }).get()

    if (existResult.data.length > 0) {
      return error(400, '您已经申请过该岗位（待审核或已通过）')
    }

    const now = db.serverDate()
    const result = await db.collection('applications').add({
      data: {
        studentId: userInfo.studentId,
        studentName: userInfo.name,
        studentInfo: {
          major: userInfo.major,
          grade: userInfo.grade,
          phone: phone || userInfo.phone,
          email: email || userInfo.email,
          college: userInfo.college,
          gender: userInfo.gender,
          familyType: userInfo.familyType
        },
        jobId: jobId,
        jobName: job.jobName,
        department: job.department,
        phone: phone || userInfo.phone,
        email: email || userInfo.email,
        availableTime: safeAvailableTime,
        experience: safeExperience,
        reason: safeReason,
        attachments: attachments,
        status: 'pending',
        statusText: '待审核',
        applyTime: now,
        reviewTime: null,
        rejectReason: '',
        reviewer: ''
      }
    })

    return success({
      applyId: result._id
    }, '申请提交成功')
  } catch (err) {
    console.error('submitApplication error:', err)
    return error(500, '提交申请失败')
  }
}

/**
 * 获取我的申请列表（支持分页）
 */
async function getMyApplications(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || userInfo.role !== 'student') {
      return unauthorized('请先以学生身份登录')
    }

    const { status = '', pageNum = 1, pageSize = 20 } = event

    let whereCondition = {
      studentId: userInfo.studentId
    }

    if (status) {
      whereCondition.status = status
    }

    // 查询总数
    const countResult = await db.collection('applications')
      .where(whereCondition)
      .count()

    // 查询列表
    const result = await db.collection('applications')
      .where(whereCondition)
      .orderBy('applyTime', 'desc')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get()

    return success({
      total: countResult.total,
      list: result.data
    })
  } catch (err) {
    console.error('getMyApplications error:', err)
    return error(500, '获取申请列表失败')
  }
}

/**
 * 获取申请详情
 */
async function getApplicationDetail(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo) {
      return unauthorized('请先登录')
    }

    const { applyId } = event

    if (!applyId) {
      return badRequest('申请ID不能为空')
    }

    const result = await db.collection('applications').doc(applyId).get()

    if (!result.data) {
      return error(404, '申请记录不存在')
    }

    const application = result.data

    // 权限检查：只能查看自己的申请，管理员可以查看所有
    if (userInfo.role === 'student' && application.studentId !== userInfo.studentId) {
      return unauthorized('无权查看此申请')
    }

    return success(application)
  } catch (err) {
    console.error('getApplicationDetail error:', err)
    return error(500, '获取申请详情失败')
  }
}

/**
 * 审核申请（管理员）
 */
async function reviewApplication(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { applyId, rejectReason = '' } = event
    // 兼容两种参数名：reviewAction（新）优先，action（旧/待部署）回退
    const reviewAction = event.reviewAction || event.action

    if (!applyId || !reviewAction || reviewAction === 'review') {
      return badRequest('申请ID和操作不能为空')
    }

    if (reviewAction !== 'approve' && reviewAction !== 'reject') {
      return badRequest('操作类型错误')
    }

    // 获取申请记录
    const appResult = await db.collection('applications').doc(applyId).get()
    if (!appResult.data) {
      return error(404, '申请记录不存在')
    }

    // 防止重复审核
    if (appResult.data.status !== 'pending') {
      return error(400, '该申请已被处理，不能重复审核')
    }

    // 驳回时必须填写理由
    if (reviewAction === 'reject' && (!rejectReason || !rejectReason.trim())) {
      return badRequest('驳回时必须填写驳回理由')
    }

    const now = db.serverDate()
    const updateData = {
      status: reviewAction === 'approve' ? 'approved' : 'rejected',
      statusText: reviewAction === 'approve' ? '已通过' : '已驳回',
      reviewTime: now,
      reviewer: userInfo.name
    }

    if (reviewAction === 'reject') {
      updateData.rejectReason = rejectReason || '不符合岗位要求'
    }

    await db.collection('applications').doc(applyId).update({
      data: updateData
    })

    return success(null, reviewAction === 'approve' ? '审核通过' : '已驳回')
  } catch (err) {
    console.error('reviewApplication error:', err)
    return error(500, '审核失败')
  }
}

/**
 * 批量审核申请（管理员）
 */
async function batchReviewApplication(event) {
  try {
    const userInfo = await verifyUser(event)
    if (!userInfo || !verifyAdmin(userInfo)) return unauthorized('需要管理员权限')

    const { applyIds = [], rejectReason = '' } = event
    const reviewAction = event.reviewAction || event.action
    if (!Array.isArray(applyIds) || applyIds.length === 0) return badRequest('请选择申请')
    if (reviewAction !== 'approve' && reviewAction !== 'reject') return badRequest('操作类型错误')
    if (reviewAction === 'reject' && (!rejectReason || !rejectReason.trim())) return badRequest('驳回时必须填写驳回理由')

    const now = db.serverDate()
    let processed = 0
    for (const id of applyIds) {
      try {
        const rec = await db.collection('applications').doc(id).get()
        if (!rec.data || rec.data.status !== 'pending') continue
        await db.collection('applications').doc(id).update({
          data: {
            status: reviewAction === 'approve' ? 'approved' : 'rejected',
            statusText: reviewAction === 'approve' ? '已通过' : '已驳回',
            reviewTime: now,
            reviewer: userInfo.name,
            rejectReason: reviewAction === 'reject' ? rejectReason : ''
          }
        })
        processed++
      } catch (err) {
        console.error('批量审核单项失败:', id, err.message)
      }
    }
    return success({ processed, total: applyIds.length }, '已处理 ' + processed + ' 条')
  } catch (err) {
    console.error('batchReviewApplication error:', err)
    return error(500, '批量审核失败')
  }
}

/**
 * 获取申请列表（管理员，支持分页）
 */
async function getAdminApplicationList(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { status = '', jobId = '', pageNum = 1, pageSize = 20 } = event

    let whereCondition = {}

    if (status) {
      whereCondition.status = status
    }

    if (jobId) {
      whereCondition.jobId = jobId
    }

    // 查询总数
    const countResult = await db.collection('applications')
      .where(whereCondition)
      .count()

    // 查询列表
    const result = await db.collection('applications')
      .where(whereCondition)
      .orderBy('applyTime', 'desc')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get()

    return success({
      total: countResult.total,
      list: result.data
    })
  } catch (err) {
    console.error('getAdminApplicationList error:', err)
    return error(500, '获取申请列表失败')
  }
}

/**
 * 取消申请
 */
async function cancelApplication(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || userInfo.role !== 'student') {
      return unauthorized('请先以学生身份登录')
    }

    const { applyId } = event

    if (!applyId) {
      return badRequest('申请ID不能为空')
    }

    const appResult = await db.collection('applications').doc(applyId).get()

    if (!appResult.data) {
      return error(404, '申请记录不存在')
    }

    if (appResult.data.studentId !== userInfo.studentId) {
      return unauthorized('无权操作此申请')
    }

    if (appResult.data.status !== 'pending') {
      return error(400, '只能取消待审核的申请')
    }

    await db.collection('applications').doc(applyId).update({
      data: {
        status: 'cancelled',
        statusText: '已取消'
      }
    })

    return success(null, '申请已取消')
  } catch (err) {
    console.error('cancelApplication error:', err)
    return error(500, '取消申请失败')
  }
}
