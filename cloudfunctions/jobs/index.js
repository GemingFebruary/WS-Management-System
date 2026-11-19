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
 * 转义正则特殊字符，防止正则注入
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

    // 限制分页大小，防止恶意请求
    const safePageSize = Math.min(Math.max(parseInt(pageSize) || 10, 1), 50)
    const safePageNum = Math.max(parseInt(pageNum) || 1, 1)

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
      const safeKeyword = escapeRegExp(keyword)
      whereCondition.$or = [
        { jobName: db.RegExp({ regexp: safeKeyword, options: 'i' }) },
        { department: db.RegExp({ regexp: safeKeyword, options: 'i' }) },
        { jobContent: db.RegExp({ regexp: safeKeyword, options: 'i' }) }
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
      .skip((safePageNum - 1) * safePageSize)
      .limit(safePageSize)
      .get()

    // 如果用户已登录，计算匹配度
    const userInfo = await verifyUser(event)
    let listWithMatchScore = result.data

    if (userInfo && userInfo.role === 'student') {
      listWithMatchScore = await calculateMatchScores(result.data, userInfo)
    }

    // 确保每个岗位都有 jobId 字段（兼容无 jobId 的旧数据）
    listWithMatchScore = listWithMatchScore.map(job => {
      if (!job.jobId) job.jobId = job._id
      if (!job.statusText) {
        job.statusText = job.status === 'recruiting' ? '招聘中' : job.status === 'full' ? '已满员' : '已关闭'
      }
      return job
    })

    return success({
      total,
      list: listWithMatchScore
    })
  } catch (err) {
    console.error('getJobList error:', err)
    return error(500, '获取岗位列表失败')
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

    // 先尝试用 _id 查找，再用 jobId 字段查找
    let jobData = null
    try {
      const result = await db.collection('jobs').doc(jobId).get()
      jobData = result.data
    } catch (e) {
      // doc() 失败，尝试 where 查询
      const result = await db.collection('jobs').where({ jobId: jobId }).limit(1).get()
      if (result.data.length > 0) {
        jobData = result.data[0]
      }
    }

    if (!jobData) {
      return error(404, '岗位不存在')
    }

    // 计算匹配度
    const userInfo = await verifyUser(event)
    if (userInfo && userInfo.role === 'student') {
      const score = calculateSingleMatchScore(jobData, userInfo)
      jobData.matchScore = score
    }

    // 确保返回统一的 jobId 字段
    if (!jobData.jobId) {
      jobData.jobId = jobData._id
    }

    return success(jobData)
  } catch (err) {
    console.error('getJobDetail error:', err)
    return error(500, '获取岗位详情失败')
  }
}

/**
 * 获取推荐岗位
 * 未登录或验证失败时，降级为返回最新招聘中的岗位（无匹配度）
 */
async function getRecommendJobs(event) {
  try {
    const userInfo = await verifyUser(event)

    // 获取所有招聘中的岗位
    const result = await db.collection('jobs')
      .where({ status: 'recruiting' })
      .orderBy('publishDate', 'desc')
      .limit(20)
      .get()

    let jobList = result.data

    // 如果用户是学生，计算匹配度并按匹配度排序
    if (userInfo && userInfo.role === 'student') {
      const jobsWithScore = await calculateMatchScores(jobList, userInfo)
      jobList = jobsWithScore
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10)
    } else {
      // 未登录或非学生，取前10条最新岗位
      jobList = jobList.slice(0, 10)
    }

    // 确保返回统一字段
    jobList = jobList.map(job => {
      if (!job.jobId) job.jobId = job._id
      if (!job.statusText) {
        job.statusText = job.status === 'recruiting' ? '招聘中' : job.status === 'full' ? '已满员' : '已关闭'
      }
      return job
    })

    return success({
      total: jobList.length,
      list: jobList
    })
  } catch (err) {
    console.error('getRecommendJobs error:', err)
    return error(500, '获取推荐岗位失败')
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
    return error(500, '发布岗位失败')
  }
}

/**
 * 更新岗位（管理员）- 使用字段白名单
 */
async function updateJob(event) {
  try {
    const userInfo = await verifyUser(event)

    if (!userInfo || !verifyAdmin(userInfo)) {
      return unauthorized('需要管理员权限')
    }

    const { jobId } = event

    if (!jobId) {
      return badRequest('岗位ID不能为空')
    }

    // 双路径查找：先 _id，再 jobId 字段
    let docId = jobId
    try {
      await db.collection('jobs').doc(jobId).get()
    } catch (e) {
      const found = await db.collection('jobs').where({ jobId: jobId }).limit(1).get()
      if (found.data.length > 0) {
        docId = found.data[0]._id
      } else {
        return error(404, '岗位不存在')
      }
    }

    // 使用白名单，只允许更新安全字段
    const allowedFields = [
      'jobName', 'department', 'jobType', 'workTime', 'salary',
      'recruitNum', 'requirement', 'jobContent', 'requiredMajor',
      'requiredGrade', 'minGpa', 'contactPerson', 'contactPhone',
      'contactEmail', 'status'
    ]

    const updateData = {}
    for (const key of allowedFields) {
      if (event[key] !== undefined) {
        updateData[key] = event[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest('没有需要更新的字段')
    }

    // 数值类型转换
    if (updateData.salary !== undefined) updateData.salary = parseFloat(updateData.salary)
    if (updateData.recruitNum !== undefined) updateData.recruitNum = parseInt(updateData.recruitNum)
    if (updateData.minGpa !== undefined) updateData.minGpa = parseFloat(updateData.minGpa)

    updateData.updateTime = db.serverDate()

    await db.collection('jobs').doc(docId).update({
      data: updateData
    })

    return success(null, '岗位更新成功')
  } catch (err) {
    console.error('updateJob error:', err)
    return error(500, '更新岗位失败')
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

    // 双路径查找
    let docId = jobId
    try {
      await db.collection('jobs').doc(jobId).get()
    } catch (e) {
      const found = await db.collection('jobs').where({ jobId: jobId }).limit(1).get()
      if (found.data.length > 0) {
        docId = found.data[0]._id
      } else {
        return error(404, '岗位不存在')
      }
    }

    await db.collection('jobs').doc(docId).remove()

    return success(null, '岗位删除成功')
  } catch (err) {
    console.error('deleteJob error:', err)
    return error(500, '删除岗位失败')
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

    // 双路径查找
    let docId = jobId
    try {
      await db.collection('jobs').doc(jobId).get()
    } catch (e) {
      const found = await db.collection('jobs').where({ jobId: jobId }).limit(1).get()
      if (found.data.length > 0) {
        docId = found.data[0]._id
      } else {
        return error(404, '岗位不存在')
      }
    }

    await db.collection('jobs').doc(docId).update({
      data: {
        status,
        updateTime: db.serverDate()
      }
    })

    return success(null, '状态更新成功')
  } catch (err) {
    console.error('toggleJobStatus error:', err)
    return error(500, '更新状态失败')
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
