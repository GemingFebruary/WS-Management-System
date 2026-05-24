// cloudfunctions/seedData/index.js - 测试数据生成云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const bcrypt = require('bcryptjs')

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  const { action = 'generate', count = 10 } = event

  if (action === 'generate') {
    return await generateTestData(count)
  } else if (action === 'clear') {
    return await clearTestData()
  } else {
    return { code: 400, message: '未知的操作' }
  }
}

/**
 * 生成测试数据
 */
async function generateTestData(count = 10) {
  console.log(`开始生成 ${count} 条测试数据...`)

  try {
    const results = {
      students: 0,
      jobs: 0,
      applications: 0,
      salaryRecords: 0
    }

    // 1. 创建测试学生账号
    const studentCount = await createTestStudents(count)
    results.students = studentCount

    // 2. 创建测试岗位
    const jobCount = await createTestJobs(count * 2)
    results.jobs = jobCount

    // 3. 创建测试申请记录
    const appCount = await createTestApplications(count)
    results.applications = appCount

    // 4. 创建测试薪资记录
    const salaryCount = await createTestSalaryRecords(count)
    results.salaryRecords = salaryCount

    return {
      code: 200,
      message: '测试数据生成成功',
      data: results
    }

  } catch (err) {
    console.error('生成测试数据失败:', err)
    return {
      code: 500,
      message: '生成测试数据失败: ' + err.message
    }
  }
}

/**
 * 创建测试学生账号
 */
async function createTestStudents(count) {
  const majors = [
    '计算机科学与技术', '软件工程', '网络工程',
    '信息管理', '电子商务', '数字媒体技术'
  ]
  const grades = ['2023级', '2024级', '2025级']
  const colleges = ['信息科学与工程', '管理学院', '艺术学院']
  const familyTypes = ['一般', '困难', '特别困难']

  let created = 0

  for (let i = 0; i < count; i++) {
    const studentId = `test${String(20230000 + i).padStart(8, '0')}`

    // 检查是否已存在
    const exist = await db.collection('users').where({ studentId }).get()
    if (exist.data.length > 0) continue

    const major = majors[Math.floor(Math.random() * majors.length)]
    const grade = grades[Math.floor(Math.random() * grades.length)]
    const college = colleges[Math.floor(Math.random() * colleges.length)]
    const familyType = familyTypes[Math.floor(Math.random() * familyTypes.length)]

    const hashedPassword = await bcrypt.hash('123456', 10)
    const now = new Date()

    await db.collection('users').add({
      data: {
        userId: studentId,
        studentId,
        name: `测试学生${i + 1}`,
        gender: i % 2 === 0 ? '男' : '女',
        college,
        major,
        grade,
        phone: `138${String(i).padStart(8, '0')}`,
        email: `test${i}@example.com`,
        familyType,
        familyDesc: '测试家庭情况',
        password: hashedPassword,
        role: 'student',
        openid: '',
        status: 'active',
        gpa: (2.5 + Math.random() * 1.5).toFixed(2),
        freeTime: getRandomFreeTime(),
        skills: ['Office', '沟通'],
        experience: '无',
        createTime: now,
        updateTime: now,
        lastLoginTime: now
      }
    })

    created++
  }

  console.log(`✅ 创建了 ${created} 个测试学生账号`)
  return created
}

/**
 * 创建测试岗位
 */
async function createTestJobs(count) {
  const departments = [
    '图书馆', '学生处', '计算机学院', '教务处',
    '后勤处', '实验室', '行政办公室', '体育馆'
  ]
  const jobTypes = ['校内', '校外']
  const workTimes = [
    '周一至周五下午 14:00-17:00',
    '周二、周四晚上 19:00-21:00',
    '周一、周三上午 9:00-12:00',
    '周末全天 9:00-17:00',
    '课余时间灵活安排',
    '周五下午 14:00-18:00'
  ]

  const jobTemplates = [
    {
      name: '图书管理员助理',
      content: '负责图书整理、借还书协助、书架维护等工作',
      requirement: '细心负责，热爱阅读，有良好的服务意识'
    },
    {
      name: '实验室技术助理',
      content: '协助实验准备、设备维护、技术支持等工作',
      requirement: '相关专业背景，具备基本实验操作能力'
    },
    {
      name: '行政办公室助理',
      content: '文件整理、数据统计、接待咨询等行政工作',
      requirement: '沟通能力好，熟练使用Office办公软件'
    },
    {
      name: '学生活动助理',
      content: '协助组织校园活动、场地布置、现场协调',
      requirement: '有组织能力，性格开朗，责任心强'
    },
    {
      name: 'IT支持助理',
      content: '电脑维护、网络故障排除、软件安装',
      requirement: '计算机相关专业，有硬件维修经验优先'
    },
    {
      name: '档案整理员',
      content: '档案分类、数字化扫描、资料归档',
      requirement: '认真细致，保密意识强'
    },
    {
      name: '前台接待助理',
      content: '来访接待、电话接听、信息登记',
      requirement: '形象气质佳，普通话标准，礼仪意识好'
    },
    {
      name: '数据录入员',
      content: '数据录入、表格制作、信息核对',
      requirement: '打字速度快，准确率高，耐心细致'
    }
  ]

  let created = 0

  for (let i = 0; i < count; i++) {
    const template = jobTemplates[i % jobTemplates.length]
    const department = departments[Math.floor(Math.random() * departments.length)]
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)]
    const workTime = workTimes[Math.floor(Math.random() * workTimes.length)]
    const salary = 12 + Math.floor(Math.random() * 13) // 12-24
    const recruitNum = 2 + Math.floor(Math.random() * 9) // 2-10

    const now = new Date()
    const publishDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)

    await db.collection('jobs').add({
      data: {
        jobName: `${template.name}${i + 1}`,
        department,
        jobType,
        workTime,
        salary,
        recruitNum,
        status: 'recruiting',
        requirement: template.requirement,
        jobContent: template.content,
        requiredMajor: '',
        requiredGrade: '',
        minGpa: 2.0 + Math.random() * 1.0,
        contactPerson: '李老师',
        contactPhone: '010-12345678',
        contactEmail: 'hr@university.edu.cn',
        publishDate,
        createTime: publishDate,
        updateTime: now,
        createdBy: 'admin'
      }
    })

    created++
  }

  console.log(`✅ 创建了 ${created} 个测试岗位`)
  return created
}

/**
 * 创建测试申请记录
 */
async function createTestApplications(count) {
  const statuses = ['pending', 'approved', 'rejected', 'cancelled']
  const statusTexts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    cancelled: '已取消'
  }

  let created = 0

  // 获取所有学生
  const students = await db.collection('users')
    .where({ role: 'student' })
    .limit(100)
    .get()

  // 获取所有岗位
  const jobs = await db.collection('jobs')
    .where({ status: 'recruiting' })
    .limit(100)
    .get()

  if (students.data.length === 0 || jobs.data.length === 0) {
    console.log('⚠️  没有足够的学生或岗位数据，跳过申请记录创建')
    return 0
  }

  for (let i = 0; i < count; i++) {
    const student = students.data[Math.floor(Math.random() * students.data.length)]
    const job = jobs.data[Math.floor(Math.random() * jobs.data.length)]

    // 检查是否已申请
    const exist = await db.collection('applications').where({
      studentId: student.studentId,
      jobId: job._id
    }).get()

    if (exist.data.length > 0) continue

    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const now = new Date()
    const applyTime = new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000)

    await db.collection('applications').add({
      data: {
        studentId: student.studentId,
        studentName: student.name,
        studentInfo: {
          major: student.major,
          grade: student.grade,
          phone: student.phone,
          email: student.email,
          college: student.college,
          gender: student.gender,
          familyType: student.familyType
        },
        jobId: job._id,
        jobName: job.jobName,
        department: job.department,
        phone: student.phone,
        email: student.email,
        availableTime: getRandomFreeTime(),
        experience: '相关实践经验',
        reason: '我对这个岗位很感兴趣，希望能获得这个机会',
        attachments: [],
        status,
        statusText: statusTexts[status],
        applyTime,
        reviewTime: status !== 'pending' ? new Date(applyTime.getTime() + 24 * 60 * 60 * 1000) : null,
        rejectReason: status === 'rejected' ? '不符合岗位要求' : '',
        reviewer: status !== 'pending' ? '管理员' : ''
      }
    })

    created++
  }

  console.log(`✅ 创建了 ${created} 条测试申请记录`)
  return created
}

/**
 * 创建测试薪资记录
 */
async function createTestSalaryRecords(count) {
  const payStatuses = ['paid', 'unpaid']

  let created = 0

  // 获取已通过的学生申请
  const approvedApps = await db.collection('applications')
    .where({ status: 'approved' })
    .limit(50)
    .get()

  if (approvedApps.data.length === 0) {
    console.log('⚠️  没有已通过的申请，跳过薪资记录创建')
    return 0
  }

  for (let i = 0; i < count; i++) {
    const app = approvedApps.data[Math.floor(Math.random() * approvedApps.data.length)]

    const workHours = 2 + Math.floor(Math.random() * 6) // 2-7小时
    const hourlyRate = 12 + Math.floor(Math.random() * 13) // 12-24元/小时
    const amount = workHours * hourlyRate

    const workDate = new Date()
    workDate.setDate(workDate.getDate() - Math.floor(Math.random() * 30))

    const month = `${workDate.getFullYear()}-${String(workDate.getMonth() + 1).padStart(2, '0')}`
    const payStatus = payStatuses[Math.floor(Math.random() * payStatuses.length)]

    await db.collection('salary_records').add({
      data: {
        studentId: app.studentId,
        jobId: app.jobId,
        jobName: app.jobName,
        workDate: workDate.toISOString().split('T')[0],
        workHours,
        hourlyRate,
        amount,
        month,
        payStatus,
        payDate: payStatus === 'paid' ? new Date(workDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        createTime: new Date(),
        createdBy: 'admin'
      }
    })

    created++
  }

  console.log(`✅ 创建了 ${created} 条测试薪资记录`)
  return created
}

/**
 * 清空测试数据
 */
async function clearTestData() {
  console.log('开始清空测试数据...')

  try {
    // 删除所有测试学生（userId以test开头）
    const testStudents = await db.collection('users')
      .where({
        userId: db.RegExp({ regexp: '^test', options: 'i' })
      })
      .remove()

    // 删除所有测试岗位（jobName包含数字后缀）
    const testJobs = await db.collection('jobs')
      .where({
        jobName: db.RegExp({ regexp: '\\d+$', options: 'i' })
      })
      .remove()

    // 删除所有测试申请（关联测试学生）
    const testApps = await db.collection('applications')
      .where({
        studentId: db.RegExp({ regexp: '^test', options: 'i' })
      })
      .remove()

    // 删除所有测试薪资记录（关联测试学生）
    const testSalaries = await db.collection('salary_records')
      .where({
        studentId: db.RegExp({ regexp: '^test', options: 'i' })
      })
      .remove()

    return {
      code: 200,
      message: '测试数据已清空',
      data: {
        deletedStudents: testStudents.removed || 0,
        deletedJobs: testJobs.removed || 0,
        deletedApplications: testApps.removed || 0,
        deletedSalaryRecords: testSalaries.removed || 0
      }
    }
  } catch (err) {
    console.error('清空测试数据失败:', err)
    return {
      code: 500,
      message: '清空测试数据失败: ' + err.message
    }
  }
}

/**
 * 获取随机空闲时间
 */
function getRandomFreeTime() {
  const times = [
    '周一上午', '周一下午', '周一晚上',
    '周二上午', '周二下午', '周二晚上',
    '周三上午', '周三下午', '周三晚上',
    '周四上午', '周四下午', '周四晚上',
    '周五上午', '周五下午', '周五晚上',
    '周六全天', '周日全天',
    '课余时间', '周末', '灵活安排'
  ]
  return times[Math.floor(Math.random() * times.length)]
}
