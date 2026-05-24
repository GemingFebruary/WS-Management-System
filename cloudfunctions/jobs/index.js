// cloudfunctions/jobs/index.js - 岗位管理云函数

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
    case 'list':
      return await getJobList(event)
    case 'detail':
      return await getJobDetail(event)
    case 'recommend':
      return await getRecommendJobs(event)
    case 'create':
      return await createJob(event)
    case 'update':
      return await updateJob(event)
    case 'delete':
      return await deleteJob(event)
    case 'toggleStatus':
      return await toggleJobStatus(event)
    default:
      return error(400, '未知的操作')
  }
}

/**
 * 获取岗位列表（支持搜索、筛选、分页）
 */
async function getJobList(event) {
  try {
    const {
      keyword = '',
      jobType = '',
      department = '',
      status = 'recruiting',
      sortBy = 'publishDate',
      pageNum = 1,
      pageSize = 10
    } = event

    // 构建查询条件
    let whereCondition = {}

    if (status) {
      whereCondition.status = status
    }

    if (jobType) {
      whereCondition.jobType = jobType
    }

    if (department) {
      whereCondition.department = department
    }

    if (keyword) {
      whereCondition.$or = [
        { jobName: db.RegExp({ regexp: keyword, options: 'i' }) },
        { department: db.RegExp({ regexp: keyword, options: 'i' }) },
        { jobContent: db.RegExp({ regexp: keyword, options: 'i' }) }
      ]
    }

    // 查询总数
    const countResult = await db.collection('jobs').where(whereCondition).count()
    const total = countResult.total

    // 排序字段映射
    const sortFieldMap = {
      publishDate: 'publishDate',
      salary: 'salary',
      recruitNum: 'recruitNum'
    }
    const sortField = sortFieldMap[sortBy] || 'publishDate'

    // 查询列表
    const result = await db.collection('jobs')
      .where(whereCondition)
      .orderBy(sortField, 'desc')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 如果用户已登录，计算匹配度
    const userInfo = await verifyUser(event)
    let listWithMatchScore = result.data

    if (userInfo && userInfo.role === 'student') {
      listWithMatchScore = await calculateMatchScores(result.data, userInfo)
    }

    return success({
      total,
      list: listWithMatchScore
    })
  } catch (err) {
    console.error('getJobList error:', err)
    return error(500, '获取岗位列表失败: ' + err.message)
  }
}

/**
 * 获取岗位详情
 */
async function getJobDetail(event) {
  try {
    const { jobId } = event

    if (!jobId) {
      return badRequest('岗位ID不能为空')
    }

    const result = await db.collection('jobs').doc(jobId).get()

    if (!result.data) {
      return error(404, '岗位不存在')
    }

    // 计算匹配度
    const userInfo = await verifyUser(event)
    let jobData = result.data

    if (userInfo && userInfo.role === 'student') {
      const score = calculateSingleMatchScore(jobData, userInfo)
      jobData.matchScore = score
    }

    return success(jobData)
  } catch (err) {
    console.error('getJobDetail error:', err)
    return error(500, '获取岗位详情失败: ' + err.message)
  }
}

/**
 * 获取推荐岗位
 */
async function getRecommendJobs(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || userInfo.role !== 'student') {
      return unauthorized('请先登录')
    }

    // 获取所有招聘中的岗位
    const result = await db.collection('jobs')
      .where({ status: 'recruiting' })
      .get()

    // 计算每个岗位的匹配度并排序
    const jobsWithScore = await calculateMatchScores(result.data, userInfo)

    // 按匹配度降序排列，返回前10个
    const recommendList = jobsWithScore
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10)

    return success({
      total: recommendList.length,
      list: recommendList
    })
  } catch (err) {
    console.error('getRecommendJobs error:', err)
    return error(500, '获取推荐岗位失败: ' + err.message)
  }
}

/**
 * 创建岗位（管理员）
 */
async function createJob(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const {
      jobName,
      department,
      jobType,
      workTime,
      salary,
      recruitNum,
      requirement,
      jobContent,
      requiredMajor,
      requiredGrade,
      minGpa,
      contactPerson,
      contactPhone,
      contactEmail
    } = event

    if (!jobName || !department || !workTime || !salary) {
      return badRequest('岗位名称、部门、工作时间和薪资为必填项')
    }

    const now = db.serverDate()
    const result = await db.collection('jobs').add({
      data: {
        jobName,
        department,
        jobType: jobType || '校内',
        workTime,
        salary: parseFloat(salary),
        recruitNum: parseInt(recruitNum) || 1,
        status: 'recruiting',
        requirement: requirement || '',
        jobContent: jobContent || '',
        requiredMajor: requiredMajor || '',
        requiredGrade: requiredGrade || '',
        minGpa: minGpa ? parseFloat(minGpa) : 0,
        contactPerson: contactPerson || '',
        contactPhone: contactPhone || '',
        contactEmail: contactEmail || '',
        publishDate: now,
        createTime: now,
        updateTime: now,
        createdBy: userInfo.userId
      }
    })

    return success({
      jobId: result._id
    }, '岗位发布成功')
  } catch (err) {
    console.error('createJob error:', err)
    return error(500, '发布岗位失败: ' + err.message)
  }
}

/**
 * 更新岗位（管理员）
 */
async function updateJob(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { jobId, ...updateData } = event

    if (!jobId) {
      return badRequest('岗位ID不能为空')
    }

    // 移除不允许更新的字段
    delete updateData._id
    delete updateData.publishDate
    delete updateData.createTime
    delete updateData.createdBy

    updateData.updateTime = db.serverDate()

    await db.collection('jobs').doc(jobId).update({
      data: updateData
    })

    return success(null, '岗位更新成功')
  } catch (err) {
    console.error('updateJob error:', err)
    return error(500, '更新岗位失败: ' + err.message)
  }
}

/**
 * 删除岗位（管理员）
 */
async function deleteJob(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { jobId } = event

    if (!jobId) {
      return badRequest('岗位ID不能为空')
    }

    await db.collection('jobs').doc(jobId).remove()

    return success(null, '岗位删除成功')
  } catch (err) {
    console.error('deleteJob error:', err)
    return error(500, '删除岗位失败: ' + err.message)
  }
}

/**
 * 切换岗位状态（管理员）
 */
async function toggleJobStatus(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { jobId, status } = event

    if (!jobId || !status) {
      return badRequest('岗位ID和状态不能为空')
    }

    await db.collection('jobs').doc(jobId).update({
      data: {
        status,
        updateTime: db.serverDate()
      }
    })

    return success(null, '状态更新成功')
  } catch (err) {
    console.error('toggleJobStatus error:', err)
    return error(500, '更新状态失败: ' + err.message)
  }
}

/**
 * 计算岗位列表的匹配度
 */
async function calculateMatchScores(jobs, studentInfo) {
  return jobs.map(job => {
    const score = calculateSingleMatchScore(job, studentInfo)
    return {
      ...job,
      matchScore: score
    }
  })
}

/**
 * 计算单个岗位的匹配度
 */
function calculateSingleMatchScore(job, studentInfo) {
  let score = 0
  let totalWeight = 0

  // 专业匹配 (权重30)
  if (studentInfo.major && job.requiredMajor) {
    totalWeight += 30
    if (studentInfo.major === job.requiredMajor) {
      score += 30
    }
  } else if (!job.requiredMajor) {
    // 没有专业要求，给基础分
    score += 15
    totalWeight += 30
  }

  // 年级匹配 (权重20)
  if (studentInfo.grade && job.requiredGrade) {
    totalWeight += 20
    if (studentInfo.grade === job.requiredGrade) {
      score += 20
    }
  } else if (!job.requiredGrade) {
    score += 10
    totalWeight += 20
  }

  // 成绩匹配 (权重25)
  if (studentInfo.gpa && job.minGpa) {
    totalWeight += 25
    if (studentInfo.gpa >= job.minGpa) {
      score += 25
    }
  } else if (!job.minGpa || job.minGpa === 0) {
    score += 12.5
    totalWeight += 25
  }

  // 时间匹配 (权重25)
  if (studentInfo.freeTime && job.workTime) {
    totalWeight += 25
    const matchTime = checkTimeMatch(studentInfo.freeTime, job.workTime)
    score += 25 * matchTime
  } else {
    score += 12.5
    totalWeight += 25
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 50
}

/**
 * 检查时间是否匹配
 */
function checkTimeMatch(freeTime, workTime) {
  if (!freeTime || !workTime) return 0.5

  // 简单的时间匹配逻辑，可根据实际情况优化
  const freeTimeStr = freeTime.toLowerCase()
  const workTimeStr = workTime.toLowerCase()

  if (freeTimeStr.includes(workTimeStr) || workTimeStr.includes(freeTimeStr)) {
    return 1
  }

  // 检查是否有重叠
  const timeKeywords = ['周一', '周二', '周三', '周四', '周五', '周六', '周日', '上午', '下午', '晚上']
  let matchCount = 0
  for (const keyword of timeKeywords) {
    if (freeTimeStr.includes(keyword) && workTimeStr.includes(keyword)) {
      matchCount++
    }
  }

  return matchCount > 0 ? 0.6 : 0.2
}
