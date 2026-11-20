// cloudfunctions/seedData/index.js - 测试数据生成云函数
// ⚠️ 仅用于开发测试，不会修改已有用户数据
// config.json 已配置 timeout: 60s

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const bcrypt = require('bcryptjs')

// ==================== 真实数据池 ====================

const MALE_NAMES = ['张伟', '李强', '王磊', '刘洋', '陈杰', '杨帆', '赵鹏', '黄涛', '周鑫', '吴昊']
const FEMALE_NAMES = ['王芳', '李娜', '张敏', '刘婷', '陈静', '杨雪', '赵丽', '黄琳', '周慧', '吴悦']

const COLLEGE_MAJOR = {
  '信息科学与工程学院': ['计算机科学与技术', '软件工程', '网络工程', '数据科学与大数据技术'],
  '管理学院': ['工商管理', '会计学', '人力资源管理', '市场营销'],
  '外国语学院': ['英语', '日语', '翻译'],
  '艺术设计学院': ['视觉传达设计', '环境设计', '数字媒体艺术'],
  '文学院': ['汉语言文学', '新闻学', '广告学'],
  '数学与统计学院': ['数学与应用数学', '统计学', '金融工程']
}

const GRADES = ['2023级', '2024级', '2025级']

const FREE_TIME_OPTIONS = [
  '周一至周五下午', '周二周四晚上', '周末全天', '周一三五上午',
  '课余时间灵活安排', '周一至周五上午', '周二四六下午', '周一三五晚上',
  '周末及节假日', '每天中午和晚上'
]

const SKILLS_OPTIONS = [
  'Office办公软件、Photoshop', 'Python编程、数据分析', '英语六级、日语N2',
  '摄影摄像、视频剪辑', 'C语言、Java编程', '写作能力强、排版设计',
  'PPT制作、Excel数据处理', '沟通协调能力强', '书法、绘画',
  '音乐、舞蹈、活动策划'
]

const PREFERRED_JOB_TYPES = [
  ['校内', '校外'], ['校内'], ['校外'], ['校内', '校外'], ['校内'],
  ['校外'], ['校内', '校外'], ['校内'], ['校外'], ['校内', '校外'],
  ['校内'], ['校外'], ['校内', '校外'], ['校内'], ['校外'],
  ['校内', '校外'], ['校内'], ['校外'], ['校内'], ['校内', '校外']
]

const COURSE_OPTIONS = [
  '周一上午 高等数学', '周二下午 大学英语', '周三上午 数据结构', '周四下午 体育', '周五上午 马克思主义基本原理',
  '周一晚上 软件工程', '周二上午 线性代数', '周三下午 计算机网络', '周四上午 数据库原理', '周五下午 毕业实习',
  '周一上午 操作系统', '周二下午 概率论', '周三上午 编译原理', '周四下午 人工智能导论', '周五上午 软件工程',
  '周一晚上 大数据技术', '周二上午 网络安全', '周三下午 云计算', '周四上午 移动开发', '周五下午 创新创业'
]

const JOB_SKILLS = [
  ['图书整理', '服务意识'], ['计算机操作', '设备维护'], ['Windows/Linux', '硬件维护', '编程基础'],
  ['Git', 'VS Code', '软件工程'], ['Office办公软件', '保密意识'], ['沟通协调', '服务意识'],
  ['普通话', '办公软件'], ['文案写作', '活动策划'], ['市场营销', '新媒体运营'],
  ['教学辅助', '耐心细致'], ['行政管理', '档案整理'], ['财务基础', 'Excel'],
  ['招生宣传', '沟通能力'], ['体育器材管理', '体力'], ['网络基础', 'Linux服务器管理'],
  ['餐饮服务', '吃苦耐劳'], ['新闻写作', '图片处理'], ['语音设备操作', '英语'],
  ['MATLAB', 'Python', '数学建模'], ['快递分拣', '体力']
]

const FAMILY_DESCS = [
  '父母均为农民，家庭年收入约3万元', '父亲工厂工人，母亲在家务农',
  '单亲家庭，母亲做保洁工作', '父母下岗，靠低保生活',
  '家中三子女同时上学，经济压力大', '父亲因病丧失部分劳动能力',
  '家庭经济一般，父母工薪阶层', '父母经营小本生意，收入不稳定'
]

const JOB_TEMPLATES = [
  { jobName: '图书馆流通部助理', department: '图书馆', jobType: '校内', workTime: '周一至周五下午 14:00-17:00', salary: 15, recruitNum: 8, requirement: '1. 工作认真负责，有良好的服务意识\n2. 熟悉图书馆基本操作流程\n3. 能够熟练使用办公软件\n4. 每周至少工作3个半天', jobContent: '1. 负责图书上架、整理工作\n2. 协助读者查询图书信息\n3. 维护阅览室秩序\n4. 参与图书盘点工作', requiredMajor: '', requiredGrade: '', minGpa: 0, contactPerson: '李明华', contactPhone: '025-85891001', contactEmail: 'library@jssnu.edu.cn' },
  { jobName: '图书馆电子阅览室管理员', department: '图书馆', jobType: '校内', workTime: '周二、周四晚上 18:30-21:00', salary: 16, recruitNum: 4, requirement: '1. 熟悉计算机基本操作\n2. 有耐心，善于沟通\n3. 能够处理简单的设备故障', jobContent: '1. 管理电子阅览室设备\n2. 指导读者使用电子资源\n3. 维护室内秩序和环境卫生\n4. 登记设备使用情况', requiredMajor: '', requiredGrade: '', minGpa: 0, contactPerson: '李明华', contactPhone: '025-85891001', contactEmail: 'library@jssnu.edu.cn' },
  { jobName: '计算机实验室助理', department: '信息科学与工程学院', jobType: '校内', workTime: '周二、周四晚上 18:30-21:00', salary: 20, recruitNum: 4, requirement: '1. 计算机相关专业\n2. 熟悉Windows/Linux系统\n3. 有基本的硬件维护能力\n4. 有编程基础者优先', jobContent: '1. 实验室开关门及设备检查\n2. 协助老师准备实验环境\n3. 解答学生基础技术问题\n4. 维护实验室设备及网络', requiredMajor: '计算机科学与技术', requiredGrade: '', minGpa: 3.0, contactPerson: '王建国', contactPhone: '025-85892001', contactEmail: 'cs-lab@jssnu.edu.cn' },
  { jobName: '软件工程实训室管理员', department: '信息科学与工程学院', jobType: '校内', workTime: '周三、周五下午 14:00-17:00', salary: 18, recruitNum: 3, requirement: '1. 软件工程专业优先\n2. 熟悉Git、VS Code等开发工具\n3. 责任心强', jobContent: '1. 管理实训室设备和软件环境\n2. 协助实训课程准备工作\n3. 记录设备使用和维护日志\n4. 环境卫生维护', requiredMajor: '软件工程', requiredGrade: '', minGpa: 2.8, contactPerson: '王建国', contactPhone: '025-85892002', contactEmail: 'se-lab@jssnu.edu.cn' },
  { jobName: '教务处学籍管理助理', department: '教务处', jobType: '校内', workTime: '周一至周五上午 8:30-11:30', salary: 16, recruitNum: 5, requirement: '1. 工作细致认真\n2. 熟练使用Office办公软件\n3. 有良好的保密意识\n4. 沟通能力良好', jobContent: '1. 协助学籍信息录入和核对\n2. 整理学生档案材料\n3. 接待学生咨询\n4. 协助成绩录入工作', requiredMajor: '', requiredGrade: '', minGpa: 2.5, contactPerson: '陈志远', contactPhone: '025-85893001', contactEmail: 'jwc@jssnu.edu.cn' },
  { jobName: '学生处综合事务助理', department: '学生处', jobType: '校内', workTime: '周一、周三、周五上午 9:00-12:00', salary: 15, recruitNum: 6, requirement: '1. 沟通能力好，服务意识强\n2. 熟练使用Office办公软件\n3. 有学生干部经历者优先', jobContent: '1. 协助学生事务咨询和接待\n2. 整理学生奖惩材料\n3. 协助组织学生活动\n4. 文件归档和数据统计', requiredMajor: '', requiredGrade: '', minGpa: 0, contactPerson: '张秀英', contactPhone: '025-85894001', contactEmail: 'xsc@jssnu.edu.cn' },
  { jobName: '财务处报销助理', department: '财务处', jobType: '校内', workTime: '周二、周四上午 9:00-12:00', salary: 16, recruitNum: 3, requirement: '1. 会计学或财务管理相关专业\n2. 数字敏感，工作细致\n3. 有基本的财务知识\n4. 保密意识强', jobContent: '1. 协助整理报销单据\n2. 录入财务数据\n3. 装订会计凭证\n4. 协助核对账目', requiredMajor: '会计学', requiredGrade: '', minGpa: 3.0, contactPerson: '刘芳', contactPhone: '025-85895001', contactEmail: 'cwc@jssnu.edu.cn' },
  { jobName: '招生办咨询助理', department: '招生办', jobType: '校内', workTime: '周一至周五下午 14:00-17:00', salary: 15, recruitNum: 4, requirement: '1. 普通话标准，形象良好\n2. 熟悉学校基本情况\n3. 有耐心，善于沟通\n4. 能熟练使用办公软件', jobContent: '1. 接听招生咨询电话\n2. 接待来访考生和家长\n3. 整理招生宣传材料\n4. 协助录取数据录入', requiredMajor: '', requiredGrade: '', minGpa: 0, contactPerson: '赵国强', contactPhone: '025-85896001', contactEmail: 'zsb@jssnu.edu.cn' },
  { jobName: '体育馆器材管理助理', department: '体育部', jobType: '校内', workTime: '周一至周五下午 16:00-18:00', salary: 14, recruitNum: 4, requirement: '1. 身体健康，热爱体育\n2. 有责任心\n3. 能搬运一定重量的器材', jobContent: '1. 体育器材的借出和归还登记\n2. 器材日常维护和整理\n3. 运动场地的开关管理\n4. 协助组织体育活动', requiredMajor: '', requiredGrade: '', minGpa: 0, contactPerson: '孙健', contactPhone: '025-85897001', contactEmail: 'tyb@jssnu.edu.cn' },
  { jobName: '网络中心技术助理', department: '网络信息中心', jobType: '校内', workTime: '灵活安排，每周不少于10小时', salary: 22, recruitNum: 3, requirement: '1. 计算机或网络工程专业\n2. 熟悉网络基础知识\n3. 了解Linux服务器管理\n4. 有网络安全意识', jobContent: '1. 校园网络设备巡检\n2. 协助处理网络故障\n3. 服务器日常维护\n4. 网络安全监控', requiredMajor: '网络工程', requiredGrade: '', minGpa: 3.2, contactPerson: '马志远', contactPhone: '025-85898001', contactEmail: 'nic@jssnu.edu.cn' },
  { jobName: '食堂服务助理', department: '后勤管理处', jobType: '校内', workTime: '午间 11:00-13:00 或晚间 17:00-19:00', salary: 18, recruitNum: 10, requirement: '1. 身体健康，有健康证\n2. 吃苦耐劳\n3. 有服务意识', jobContent: '1. 协助餐具回收和清洁\n2. 维护就餐秩序\n3. 协助打餐服务\n4. 餐厅环境卫生维护', requiredMajor: '', requiredGrade: '', minGpa: 0, contactPerson: '周大伟', contactPhone: '025-85899001', contactEmail: 'hq@jssnu.edu.cn' },
  { jobName: '校报编辑部助理', department: '党委宣传部', jobType: '校内', workTime: '周二、周四下午 14:00-17:00', salary: 16, recruitNum: 3, requirement: '1. 新闻学或中文相关专业优先\n2. 文字功底好\n3. 有新闻敏感性\n4. 会使用图片处理软件者优先', jobContent: '1. 采访校园新闻\n2. 撰写新闻稿件\n3. 编辑和校对文章\n4. 维护校报新媒体平台', requiredMajor: '汉语言文学', requiredGrade: '', minGpa: 3.0, contactPerson: '钱文华', contactPhone: '025-85890010', contactEmail: 'xcb@jssnu.edu.cn' },
  { jobName: '外语学院语音室助理', department: '外国语学院', jobType: '校内', workTime: '周一至周五上午 8:00-11:00', salary: 15, recruitNum: 4, requirement: '1. 英语四级以上\n2. 熟悉语音设备操作\n3. 有耐心，工作认真', jobContent: '1. 语音室设备开关和调试\n2. 协助老师准备听力材料\n3. 维护语音设备\n4. 课后设备检查和清洁', requiredMajor: '', requiredGrade: '', minGpa: 2.5, contactPerson: '林美玲', contactPhone: '025-85890020', contactEmail: 'wgyxy@jssnu.edu.cn' },
  { jobName: '数学建模实验室助理', department: '数学与统计学院', jobType: '校内', workTime: '周三、周五晚上 19:00-21:30', salary: 18, recruitNum: 3, requirement: '1. 数学或统计学相关专业\n2. 熟悉MATLAB、Python等工具\n3. 有数学建模经验者优先', jobContent: '1. 实验室设备管理\n2. 协助数学建模培训\n3. 维护实验软件环境\n4. 整理建模竞赛资料', requiredMajor: '数学与应用数学', requiredGrade: '', minGpa: 3.0, contactPerson: '郑教授', contactPhone: '025-85890030', contactEmail: 'math@jssnu.edu.cn' },
  { jobName: '校园快递驿站分拣员', department: '后勤管理处', jobType: '校内', workTime: '午间 12:00-14:00 和晚间 18:00-20:00', salary: 16, recruitNum: 8, requirement: '1. 吃苦耐劳\n2. 工作认真细致\n3. 能在高峰期加班', jobContent: '1. 快递包裹分拣和上架\n2. 协助学生取件\n3. 处理异常件\n4. 驿站环境卫生维护', requiredMajor: '', requiredGrade: '', minGpa: 0, contactPerson: '周大伟', contactPhone: '025-85899002', contactEmail: 'hq@jssnu.edu.cn' }
]

const REASONS = [
  '家庭经济困难，父母务农收入微薄，弟弟还在读高中，希望通过勤工助学减轻家庭经济负担，同时锻炼自己的实践能力。',
  '来自农村家庭，家庭收入较低，学费和生活费给家里带来较大压力。我学习认真，时间充裕，希望获得这个岗位来补贴生活费用。',
  '父亲因病丧失劳动能力，母亲在家照顾，家庭经济来源有限。我想通过自己的努力赚取部分生活费，不给家里增添更多负担。',
  '单亲家庭，母亲独自抚养我和姐姐，经济压力较大。我希望利用课余时间工作，既能锻炼自己，又能减轻母亲的负担。',
  '家中有三个孩子同时上学，父母负担沉重。我成绩优良，课余时间充足，希望能获得勤工助学岗位，靠自己的双手解决部分费用。',
  '对这个岗位的工作内容很感兴趣，希望在实践中提升自己的专业技能和综合素质，同时获得一定的经济收入。',
  '希望通过勤工助学岗位积累工作经验，提升沟通能力和团队协作能力，为将来就业打下基础。',
  '热爱本专业，希望在相关岗位上将课堂所学应用于实践，加深对专业知识的理解，同时赚取生活费。'
]

const REJECT_REASONS = [
  '该岗位已招满，建议关注其他类似岗位',
  '专业要求不匹配，建议申请不限专业的岗位',
  '课程时间与工作时间冲突，无法保证出勤',
  '已有其他勤工助学岗位，不可同时兼任'
]

// ==================== 云函数入口 ====================

exports.main = async (event, context) => {
  const { action = 'generate' } = event
  if (action === 'generate') return await generateTestData()
  if (action === 'clear') return await clearTestData()
  return { code: 400, message: '未知的操作' }
}

// ==================== 主生成函数 ====================

async function generateTestData() {
  console.log('开始生成测试数据...')
  try {
    const results = { students: 0, jobs: 0, applications: 0, salaryRecords: 0, notices: 0 }

    results.students = await createTestStudents()
    results.jobs = await createTestJobs()
    results.applications = await createTestApplications()
    results.salaryRecords = await createTestSalaryRecords()
    results.notices = await createTestNotices()

    return { code: 200, message: '测试数据生成成功', data: results }
  } catch (err) {
    console.error('生成测试数据失败:', err)
    return { code: 500, message: '生成测试数据失败: ' + err.message }
  }
}

// ==================== 学生数据（批量写入） ====================

async function createTestStudents() {
  const hashedPassword = await bcrypt.hash('123456', 10)
  const now = new Date()
  const collegeKeys = Object.keys(COLLEGE_MAJOR)

  // 先查已有学生ID，跳过已存在的
  const existing = await db.collection('users').where({ role: 'student' }).field({ studentId: true }).limit(100).get()
  const existIds = new Set(existing.data.map(u => u.studentId))

  const students = []
  for (let i = 0; i < 20; i++) {
    const isMale = i < 10
    const name = isMale ? MALE_NAMES[i] : FEMALE_NAMES[i - 10]
    const college = collegeKeys[i % collegeKeys.length]
    const major = COLLEGE_MAJOR[college][i % COLLEGE_MAJOR[college].length]
    const grade = GRADES[i % GRADES.length]
    const studentId = `js23${String(8000 + i).padStart(4, '0')}`

    if (existIds.has(studentId)) continue

    let familyType = '一般'
    if (i < 5) familyType = '困难'
    if (i >= 5 && i < 8) familyType = '特别困难'

    students.push({
      userId: studentId, studentId, openid: '', name, gender: isMale ? '男' : '女',
      college, major, grade,
      phone: `138${String(10000000 + i * 12345).padStart(8, '0')}`,
      email: `${studentId}@stu.jssnu.edu.cn`,
      familyType, familyDesc: FAMILY_DESCS[i % FAMILY_DESCS.length],
      password: hashedPassword, role: 'student', status: 'active',
      gpa: parseFloat((2.5 + (i % 16) * 0.1).toFixed(1)),
      freeTime: FREE_TIME_OPTIONS[i % FREE_TIME_OPTIONS.length],
      skills: SKILLS_OPTIONS[i % SKILLS_OPTIONS.length],
      preferredJobTypes: PREFERRED_JOB_TYPES[i % PREFERRED_JOB_TYPES.length],
      courses: COURSE_OPTIONS[i % COURSE_OPTIONS.length],
      experience: i % 3 === 0 ? '有相关实践经验' : (i % 3 === 1 ? '学生会干部经历' : '暂无相关经验'),
      createTime: new Date(now.getTime() - (30 - i) * 24 * 60 * 60 * 1000),
      updateTime: now,
      lastLoginTime: new Date(now.getTime() - i * 12 * 60 * 60 * 1000)
    })
  }

  // 批量写入（单次 add 支持数组）
  if (students.length > 0) {
    await db.collection('users').add({ data: students })
  }
  console.log(`✅ 创建了 ${students.length} 个测试学生`)
  return students.length
}

// ==================== 岗位数据（批量写入） ====================

async function createTestJobs() {
  const now = new Date()

  // 查已有岗位名
  const existing = await db.collection('jobs').field({ jobName: true }).limit(100).get()
  const existNames = new Set(existing.data.map(j => j.jobName))

  const jobs = []
  for (let i = 0; i < JOB_TEMPLATES.length; i++) {
    const tmpl = JOB_TEMPLATES[i]
    if (existNames.has(tmpl.jobName)) continue

    let status = 'recruiting'
    if (i === 14) status = 'closed'
    if (i === 13) status = 'full'

    jobs.push({
      ...tmpl, status,
      requiredSkills: JOB_SKILLS[i % JOB_SKILLS.length],
      publishDate: new Date(now.getTime() - (JOB_TEMPLATES.length - i) * 3 * 24 * 60 * 60 * 1000),
      createTime: new Date(now.getTime() - (JOB_TEMPLATES.length - i) * 3 * 24 * 60 * 60 * 1000),
      updateTime: now,
      createdBy: 'admin'
    })
  }

  if (jobs.length > 0) {
    await db.collection('jobs').add({ data: jobs })
  }
  console.log(`✅ 创建了 ${jobs.length} 个测试岗位`)
  return jobs.length
}

// ==================== 申请数据 ====================

async function createTestApplications() {
  const now = new Date()

  const studentsRes = await db.collection('users').where({ role: 'student' }).limit(50).get()
  const jobsRes = await db.collection('jobs').limit(50).get()
  const students = studentsRes.data
  const jobs = jobsRes.data
  if (students.length === 0 || jobs.length === 0) return 0

  const applicationPlan = [
    { si: 0, ji: 0, status: 'approved', d: 25 }, { si: 1, ji: 0, status: 'approved', d: 23 },
    { si: 2, ji: 2, status: 'approved', d: 20 }, { si: 3, ji: 4, status: 'approved', d: 18 },
    { si: 4, ji: 6, status: 'approved', d: 15 }, { si: 5, ji: 1, status: 'approved', d: 12 },
    { si: 6, ji: 5, status: 'approved', d: 10 }, { si: 7, ji: 8, status: 'approved', d: 8 },
    { si: 8, ji: 3, status: 'approved', d: 6 },  { si: 9, ji: 7, status: 'approved', d: 5 },
    { si: 10, ji: 0, status: 'pending', d: 3 },  { si: 11, ji: 2, status: 'pending', d: 2 },
    { si: 12, ji: 4, status: 'pending', d: 2 },  { si: 13, ji: 6, status: 'pending', d: 1 },
    { si: 14, ji: 9, status: 'pending', d: 1 },  { si: 15, ji: 10, status: 'pending', d: 1 },
    { si: 10, ji: 5, status: 'pending', d: 3 },  { si: 11, ji: 8, status: 'pending', d: 2 },
    { si: 16, ji: 2, status: 'rejected', d: 15 }, { si: 17, ji: 9, status: 'rejected', d: 12 },
    { si: 18, ji: 3, status: 'rejected', d: 10 }, { si: 19, ji: 10, status: 'rejected', d: 8 },
    { si: 16, ji: 0, status: 'cancelled', d: 20 }, { si: 17, ji: 5, status: 'cancelled', d: 18 },
    { si: 18, ji: 7, status: 'cancelled', d: 14 },
    { si: 16, ji: 2, status: 'pending', d: 1 },
    { si: 0, ji: 4, status: 'pending', d: 2 },  { si: 1, ji: 6, status: 'rejected', d: 10 },
    { si: 2, ji: 8, status: 'pending', d: 1 },  { si: 3, ji: 1, status: 'approved', d: 7 },
  ]

  // 批量构建，跳过已存在的
  const existRes = await db.collection('applications').field({ studentId: true, jobId: true }).limit(100).get()
  const existKeys = new Set(existRes.data.map(a => `${a.studentId}_${a.jobId}`))

  const apps = []
  for (const plan of applicationPlan) {
    const student = students[plan.si % students.length]
    const job = jobs[plan.ji % jobs.length]
    if (!student || !job) continue

    const key = `${student.studentId}_${job._id}`
    if (existKeys.has(key)) continue

    const applyTime = new Date(now.getTime() - plan.d * 24 * 60 * 60 * 1000)
    const reviewTime = plan.status !== 'pending'
      ? new Date(applyTime.getTime() + (1 + (plan.si % 3)) * 24 * 60 * 60 * 1000)
      : null

    apps.push({
      studentId: student.studentId, studentName: student.name,
      studentInfo: { major: student.major, grade: student.grade, phone: student.phone, email: student.email, college: student.college, gender: student.gender, familyType: student.familyType },
      jobId: job._id, jobName: job.jobName, department: job.department,
      phone: student.phone, email: student.email,
      availableTime: student.freeTime || '课余时间',
      experience: student.experience || '',
      reason: REASONS[plan.si % REASONS.length],
      attachments: [], status: plan.status,
      applyTime, reviewTime,
      rejectReason: plan.status === 'rejected' ? REJECT_REASONS[plan.si % REJECT_REASONS.length] : '',
      reviewer: plan.status !== 'pending' ? 'admin' : '',
      cancelTime: plan.status === 'cancelled' ? new Date(applyTime.getTime() + 2 * 24 * 60 * 60 * 1000) : null
    })
  }

  if (apps.length > 0) {
    await db.collection('applications').add({ data: apps })
  }
  console.log(`✅ 创建了 ${apps.length} 条申请记录`)
  return apps.length
}

// ==================== 薪资数据 ====================

async function createTestSalaryRecords() {
  const approvedRes = await db.collection('applications').where({ status: 'approved' }).limit(50).get()
  const approvedApps = approvedRes.data
  if (approvedApps.length === 0) return 0

  const jobsRes = await db.collection('jobs').limit(50).get()
  const jobsMap = {}
  jobsRes.data.forEach(j => { jobsMap[j._id] = j })

  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']

  // 查已有薪资记录
  const existRes = await db.collection('salary_records').field({ studentId: true, workDate: true }).limit(100).get()
  const existKeys = new Set(existRes.data.map(s => `${s.studentId}_${s.workDate}`))

  const records = []
  for (const app of approvedApps) {
    const job = jobsMap[app.jobId]
    const hourlyRate = job ? job.salary : 15
    const monthCount = 2 + (app.studentId.charCodeAt(6) % 3) // 确定性分布

    for (let m = 0; m < monthCount; m++) {
      const month = months[m]
      const recordsPerMonth = 2 + (m % 2)

      for (let r = 0; r < recordsPerMonth; r++) {
        const day = Math.min(1 + r * 7 + (m % 5), 28)
        const workDate = `${month}-${String(day).padStart(2, '0')}`

        if (existKeys.has(`${app.studentId}_${workDate}`)) continue

        const workHours = parseFloat((2 + ((app.studentId.charCodeAt(5) + r) % 5) * 0.8).toFixed(1))
        const amount = parseFloat((workHours * hourlyRate).toFixed(2))
        const isPaid = m < monthCount - 1

        records.push({
          studentId: app.studentId, jobId: app.jobId, jobName: app.jobName,
          workDate, workHours, hourlyRate, amount, month,
          payStatus: isPaid ? 'paid' : 'unpaid',
          payDate: isPaid ? `${month}-${String(Math.min(day + 5, 28)).padStart(2, '0')}` : null,
          createTime: new Date(), createdBy: 'admin'
        })
      }
    }
  }

  // 分批写入（每批最多20条）
  const BATCH = 20
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    if (batch.length > 0) {
      await db.collection('salary_records').add({ data: batch })
    }
  }

  console.log(`✅ 创建了 ${records.length} 条薪资记录`)
  return records.length
}

// ==================== 公告数据 ====================

async function createTestNotices() {
  // 先查已有公告，跳过重复
  const existing = await db.collection('notices').field({ title: true }).limit(100).get()
  const existTitles = new Set(existing.data.map(n => n.title))

  const noticeData = [
    { title: '2026年春季勤工助学岗位开始申请', content: '各位同学，2026年春季学期勤工助学岗位已发布，请登录系统查看并申请。申请截止日期：2026年5月15日。', publishDate: db.serverDate(), publisher: '系统管理员' },
    { title: '图书馆助理岗位新增20个名额', content: '因工作需要，图书馆助理岗位新增20个名额，欢迎有意向的同学积极报名。', publishDate: db.serverDate(), publisher: '系统管理员' },
    { title: '关于规范勤工助学薪资发放的通知', content: '为保障同学们的权益，即日起勤工助学薪资将于每月15日前统一发放至银行卡，请确保个人信息中的银行卡号正确。', publishDate: db.serverDate(), publisher: '系统管理员' },
    { title: '五一假期勤工助学工作安排', content: '五一劳动节放假期间（5月1日-5月5日），所有勤工助学岗位暂停工作，假期后恢复正常。如有特殊情况请联系管理员。', publishDate: db.serverDate(), publisher: '系统管理员' },
    { title: '勤工助学岗前培训通知', content: '本学期新上岗同学须参加岗前培训，培训时间：4月20日下午2:00，地点：学生活动中心301室。', publishDate: db.serverDate(), publisher: '系统管理员' },
    { title: '计算机学院实验室助理招聘', content: '计算机学院新增3个实验室助理岗位，要求计算机相关专业，有编程基础者优先。薪资20元/时，欢迎申请。', publishDate: db.serverDate(), publisher: '系统管理员' },
    { title: '关于开展勤工助学优秀学生评选的通知', content: '为表彰在勤工助学中表现突出的同学，现开展本学期优秀勤工助学学生评选工作，请各岗位推荐1-2名候选人。', publishDate: db.serverDate(), publisher: '系统管理员' },
    { title: '勤工助学系统上线公告', content: '勤工助学岗位匹配管理系统已正式上线，支持Web端和微信小程序端。系统支持智能岗位匹配、在线申请、薪资查询等功能。', publishDate: db.serverDate(), publisher: '系统管理员' }
  ]

  // 过滤已存在的标题
  const newNotices = noticeData.filter(n => !existTitles.has(n.title))
  if (newNotices.length > 0) {
    await db.collection('notices').add({ data: newNotices })
  }

  console.log(`✅ 创建了 ${newNotices.length} 条公告（已有 ${existTitles.size} 条）`)
  return newNotices.length
}

// ==================== 清空测试数据 ====================

async function clearTestData() {
  console.log('开始清空测试数据...')
  try {
    const r1 = await db.collection('users').where({ studentId: db.RegExp({ regexp: '^js238', options: '' }), role: 'student' }).remove()
    const r2 = await db.collection('jobs').where({ contactEmail: db.RegExp({ regexp: 'jssnu\\.edu\\.cn$', options: '' }) }).remove()
    const r3 = await db.collection('applications').where({ studentId: db.RegExp({ regexp: '^js238', options: '' }) }).remove()
    const r4 = await db.collection('salary_records').where({ studentId: db.RegExp({ regexp: '^js238', options: '' }) }).remove()
    const r5 = await db.collection('notices').where({ publisher: '系统管理员' }).remove()

    return {
      code: 200, message: '测试数据已清空',
      data: { deletedStudents: r1.removed || 0, deletedJobs: r2.removed || 0, deletedApplications: r3.removed || 0, deletedSalaryRecords: r4.removed || 0, deletedNotices: r5.removed || 0 }
    }
  } catch (err) {
    console.error('清空测试数据失败:', err)
    return { code: 500, message: '清空测试数据失败: ' + err.message }
  }
}
