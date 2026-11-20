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
    case 'getOptions':
      return await getStudyOptions()
    case 'getMatchConfig':
      return await getMatchConfig()
    case 'updateMatchConfig':
      return await updateMatchConfig(event)
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
      const m = await calculateMatchSingle(jobData, userInfo)
      jobData.matchScore = m.score
      jobData.matchDimensions = m.dimensions
      jobData.matchReasons = m.reasons
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
      contactEmail,
      requiredSkills
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
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
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
      'contactEmail', 'requiredSkills', 'status'
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
/**
 * 默认匹配权重（match_config 未配置时使用）
 */
const DEFAULT_OPTIONS = {
  colleges: ['信息科学与工程学院', '管理学院', '外国语学院', '艺术设计学院', '文学院', '数学与统计学院'],
  majors: {
    '信息科学与工程学院': ['计算机科学与技术', '软件工程', '网络工程', '数据科学与大数据技术'],
    '管理学院': ['工商管理', '会计学', '人力资源管理', '市场营销'],
    '外国语学院': ['英语', '日语', '翻译'],
    '艺术设计学院': ['视觉传达设计', '环境设计', '数字媒体艺术'],
    '文学院': ['汉语言文学', '新闻学', '广告学'],
    '数学与统计学院': ['数学与应用数学', '统计学', '金融工程']
  },
  skills: ['Office办公软件', 'Photoshop', 'Python编程', '数据分析', '英语六级', '日语N2', '摄影摄像', '视频剪辑', 'C语言', 'Java编程', '写作能力', '排版设计', 'PPT制作', 'Excel数据处理', '沟通协调', '书法', '绘画', '音乐', '舞蹈', '活动策划']
}

const DEFAULT_MATCH_WEIGHTS = { skill: 25, time: 25, preference: 25, conflict: 25 }

const MATCH_DIMENSION_META = [
  { key: 'skill', name: '技能标签' },
  { key: 'time', name: '可工作时间' },
  { key: 'preference', name: '岗位类型偏好' },
  { key: 'conflict', name: '年级/课程' }
]

/**
 * 读取选项库（学院/专业/技能）
 */
async function getStudyOptions() {
  try {
    const res = await db.collection('system_options').doc('study').get()
    const doc = res.data && res.data[0]
    if (doc && doc.colleges) return success(doc)
  } catch (err) {
    console.warn('读取选项库失败，使用默认值:', err.message)
  }
  return success(DEFAULT_OPTIONS)
}

/**
 * 读取匹配权重配置
 */
async function getMatchWeights() {
  try {
    const res = await db.collection('match_config').doc('match').get()
    const doc = res.data && res.data[0]
    if (doc && doc.weights) return normalizeWeights(doc.weights)
  } catch (err) {
    console.warn('读取匹配权重失败，使用默认值:', err.message)
  }
  return { ...DEFAULT_MATCH_WEIGHTS }
}

function normalizeWeights(w) {
  const toNum = (v) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }
  w = w || {}
  return {
    skill: toNum(w.skill),
    time: toNum(w.time),
    preference: toNum(w.preference),
    conflict: toNum(w.conflict)
  }
}

/**
 * 获取匹配权重配置
 */
async function getMatchConfig() {
  const weights = await getMatchWeights()
  return success({ weights, dimensions: MATCH_DIMENSION_META })
}

/**
 * 更新匹配权重配置（仅管理员）
 */
async function updateMatchConfig(event) {
  const { weights } = event || {}
  if (!weights) return badRequest('缺少权重参数')
  const w = normalizeWeights(weights)
  const total = w.skill + w.time + w.preference + w.conflict
  if (total <= 0) return badRequest('权重总和必须大于 0')

  const admin = await verifyAdmin(event)
  if (!admin) return unauthorized('仅管理员可配置匹配权重')

  const data = {
    weights: w,
    updatedBy: admin.userId || 'admin',
    updateTime: db.serverDate()
  }
  try {
    await db.collection('match_config').doc('match').set({ data })
  } catch (err) {
    await db.collection('match_config').add({ data: { _id: 'match', ...data } })
  }
  return success({ weights: w }, '匹配权重已更新')
}

/**
 * 计算单个岗位匹配（含权重）
 */
async function calculateMatchSingle(job, studentInfo) {
  const weights = await getMatchWeights()
  return computeMatch(job, studentInfo, weights)
}

/**
 * 批量计算匹配
 */
async function calculateMatchScores(jobs, studentInfo) {
  const weights = await getMatchWeights()
  return jobs.map(job => {
    const m = computeMatch(job, studentInfo, weights)
    return {
      ...job,
      matchScore: m.score,
      matchDimensions: m.dimensions,
      matchReasons: m.reasons
    }
  })
}

/**
 * 匹配度计算核心：可解释的多维加权模型
 * 输出 { score(0-100), dimensions(维度分解), reasons(匹配依据) }
 */
function computeMatch(job, studentInfo, weights) {
  const dims = []
  const reasons = []
  const w = normalizeWeights(weights)
  const totalW = w.skill + w.time + w.preference + w.conflict

  // 1. 技能标签匹配度
  const reqSkills = toStringArray(job.requiredSkills)
  const stuSkills = toStringArray(studentInfo.skills)
  let skillScore = 100
  let skillDetail = '岗位无技能要求'
  let skillHit = []
  if (reqSkills.length > 0) {
    skillHit = reqSkills.filter(s => stuSkills.includes(s))
    skillScore = Math.round((skillHit.length / reqSkills.length) * 100)
    skillDetail = skillHit.length
      ? `命中 ${skillHit.length}/${reqSkills.length} 项技能`
      : '未命中任何技能要求'
    if (skillHit.length) reasons.push(`技能匹配：${skillHit.join('、')}`)
  } else {
    reasons.push('岗位无技能要求')
  }
  dims.push({ key: 'skill', name: '技能标签', score: skillScore, weight: w.skill, detail: skillDetail })

  // 2. 可工作时间重合度
  const timeScore = calcTimeOverlap(studentInfo.freeTime, job.workTime)
  const timeDetail = `空闲「${studentInfo.freeTime || '未填写'}」 vs 岗位「${job.workTime || '未填写'}」`
  dims.push({ key: 'time', name: '可工作时间', score: timeScore, weight: w.time, detail: timeDetail })
  reasons.push(timeScore >= 80 ? '时间高度重合' : timeScore >= 50 ? '时间部分重合' : '时间重合度低')

  // 3. 岗位类型偏好
  const prefs = toStringArray(studentInfo.preferredJobTypes)
  let prefScore = 60
  let prefDetail = '未设置岗位偏好（中性）'
  if (prefs.length === 0) {
    reasons.push('未设置岗位偏好')
  } else if (prefs.includes(String(job.jobType || '').trim().toLowerCase())) {
    prefScore = 100
    prefDetail = `符合偏好类型：${job.jobType}`
    reasons.push(`符合偏好类型：${job.jobType}`)
  } else {
    prefScore = 20
    prefDetail = `与偏好类型不符（偏好：${prefs.join('/')}）`
    reasons.push('与偏好类型不符')
  }
  dims.push({ key: 'preference', name: '岗位类型偏好', score: prefScore, weight: w.preference, detail: prefDetail })

  // 4. 年级与课程冲突
  let conflictScore = 100
  const conflictMsgs = []
  if (job.requiredGrade && studentInfo.grade && job.requiredGrade !== studentInfo.grade) {
    conflictScore = 0
    conflictMsgs.push(`年级不符（要求 ${job.requiredGrade}）`)
  }
  if (hasCourseConflict(studentInfo.courses, job.workTime)) {
    conflictScore = Math.min(conflictScore, 40)
    conflictMsgs.push('课程时间可能冲突')
  }
  if (conflictMsgs.length === 0) conflictMsgs.push('年级与课程无冲突')
  reasons.push(conflictMsgs.join('；'))
  dims.push({ key: 'conflict', name: '年级/课程', score: conflictScore, weight: w.conflict, detail: conflictMsgs.join('；') })

  const score = totalW > 0
    ? Math.round((skillScore * w.skill + timeScore * w.time + prefScore * w.preference + conflictScore * w.conflict) / totalW)
    : 50

  return { score, dimensions: dims, reasons }
}

/**
 * 将字符串/数组统一为去重小写标签数组
 */
function toStringArray(v) {
  if (Array.isArray(v)) return v.map(s => String(s).trim().toLowerCase()).filter(Boolean)
  if (typeof v === 'string' && v.trim()) {
    return v.split(/[,，、;；\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
  }
  return []
}

const TIME_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const TIME_PERIODS = ['上午', '中午', '午间', '下午', '晚上']

function parseTimeKeywords(str) {
  const s = String(str || '')
  const periods = TIME_PERIODS.filter(p => s.includes(p))
  const inferred = inferPeriodsFromTimeRange(s)
  return {
    days: TIME_DAYS.filter(d => s.includes(d)),
    periods: [...new Set([...periods, ...inferred])]
  }
}

/**
 * 从时间区间（如 14:00-17:00）推断所覆盖的时段关键词
 */
function inferPeriodsFromTimeRange(str) {
  const s = String(str || '')
  const periods = []
  const re = /(\d{1,2}):(\d{2})\s*[-—~]\s*(\d{1,2}):(\d{2})/g
  let m
  while ((m = re.exec(s)) !== null) {
    const start = Number(m[1]) + Number(m[2]) / 60
    const end = Number(m[3]) + Number(m[4]) / 60
    if (start < 12) periods.push('上午')
    if (start < 14 && end > 12) periods.push('中午')
    if ((start >= 13 && start < 18) || (end > 14 && start < 18)) periods.push('下午')
    if (end > 18) periods.push('晚上')
  }
  return [...new Set(periods)]
}

/**
 * 计算可工作时间重合度（0-100）
 */
function calcTimeOverlap(freeTime, workTime) {
  if (!freeTime || !workTime) return 60
  const f = parseTimeKeywords(freeTime)
  const w = parseTimeKeywords(workTime)
  if (w.days.length === 0 && w.periods.length === 0) return 50
  let score = 0
  if (w.days.length > 0) {
    const hit = w.days.filter(d => f.days.includes(d)).length
    score += 60 * (hit / w.days.length)
  } else if (f.days.length > 0) {
    score += 60
  }
  if (w.periods.length > 0) {
    const hit = w.periods.filter(p => f.periods.includes(p)).length
    score += 40 * (hit / w.periods.length)
  } else if (f.periods.length > 0) {
    score += 40
  }
  if (score === 0) return 20
  return Math.round(score)
}

/**
 * 课程冲突检测：学生课程时间与岗位工作时间在同一天同一时段即视为冲突
 */
function hasCourseConflict(courses, workTime) {
  const c = String(courses || '')
  if (!c.trim()) return false
  const w = parseTimeKeywords(workTime)
  if (w.days.length === 0 && w.periods.length === 0) return false
  const cDays = TIME_DAYS.filter(d => c.includes(d))
  const cPeriods = TIME_PERIODS.filter(p => c.includes(p))
  const dayClash = w.days.some(d => cDays.includes(d))
  const periodClash = w.periods.some(p => cPeriods.includes(p))
  return dayClash && periodClash
}
