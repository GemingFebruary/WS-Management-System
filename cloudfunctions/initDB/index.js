// cloudfunctions/initDB/index.js - 数据库初始化云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const bcrypt = require('bcryptjs')

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  const { action = 'init' } = event

  if (action === 'init') {
    return await initDatabase()
  } else if (action === 'reset') {
    return await resetDatabase()
  } else {
    return {
      code: 400,
      message: '未知的操作'
    }
  }
}

/**
 * 初始化数据库
 */
async function initDatabase() {
  console.log('开始初始化数据库...')

  try {
    // 1. 创建集合
    const collections = ['users', 'jobs', 'applications', 'salary_records', 'system_logs', 'notices', 'match_config']
    const createResults = []

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName)
        console.log(`✅ 集合 [${collectionName}] 创建成功`)
        createResults.push({ name: collectionName, status: 'created' })
      } catch (err) {
        // -502001 或 -501001 都表示集合已存在
        if (err.errCode === -502001 || err.errCode === -501001 || 
            (err.message && err.message.includes('already exist'))) {
          console.log(`ℹ️  集合 [${collectionName}] 已存在`)
          createResults.push({ name: collectionName, status: 'exists' })
        } else {
          throw err
        }
      }
    }

    // 1.1 初始化匹配权重配置（可配置多维加权匹配）
    try {
      const cfg = await db.collection('match_config').doc('match').get()
      const exists = cfg.data && cfg.data.length > 0
      if (!exists) {
        await db.collection('match_config').add({
          data: {
            _id: 'match',
            weights: { skill: 25, time: 25, preference: 25, conflict: 25 },
            updatedBy: 'system',
            updateTime: db.serverDate()
          }
        })
        console.log('✅ 匹配权重配置初始化完成')
      }
    } catch (err) {
      await db.collection('match_config').add({
        data: {
          _id: 'match',
          weights: { skill: 25, time: 25, preference: 25, conflict: 25 },
          updatedBy: 'system',
          updateTime: db.serverDate()
        }
      })
      console.log('✅ 匹配权重配置初始化完成（回退）')
    }

    // 2. 创建索引（性能优化）
    console.log('开始创建数据库索引...')
    const indexResults = []
    
    try {
      // users集合索引
      await createIndex('users', { studentId: 1 }, { unique: true })
      await createIndex('users', { openid: 1 })
      await createIndex('users', { role: 1, status: 1 })
      
      // jobs集合索引
      await createIndex('jobs', { status: 1, publishDate: -1 })
      await createIndex('jobs', { department: 1 })
      await createIndex('jobs', { jobType: 1 })
      
      // applications集合索引
      await createIndex('applications', { studentId: 1, status: 1 })
      await createIndex('applications', { jobId: 1 })
      await createIndex('applications', { applyTime: -1 })
      
      // salary_records集合索引
      await createIndex('salary_records', { studentId: 1, month: 1 })
      await createIndex('salary_records', { payStatus: 1 })
      await createIndex('salary_records', { createTime: -1 })
      
      indexResults.push({ status: 'success', message: '索引创建完成' })
      console.log('✅ 数据库索引创建成功')
    } catch (err) {
      console.error('索引创建失败:', err)
      indexResults.push({ status: 'error', message: err.message })
    }

    // 3. 创建管理员账号
    let adminResult = {}
    try {
      const adminExist = await db.collection('users').where({ role: 'admin' }).get()

      if (adminExist.data.length === 0) {
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        const now = db.serverDate()

        await db.collection('users').add({
          data: {
            userId: 'admin',
            studentId: '',
            name: '系统管理员',
            gender: '',
            college: '',
            major: '',
            grade: '',
            phone: '',
            email: '',
            familyType: '',
            familyDesc: '',
            password: hashedPassword,
            role: 'admin',
            openid: '',
            status: 'active',
            createTime: now,
            updateTime: now,
            lastLoginTime: now
          }
        })

        adminResult = {
          status: 'created',
          account: 'admin',
          password: adminPassword,
          message: '请登录后及时修改密码！'
        }
        console.log('✅ 默认管理员账号创建成功')
      } else {
        adminResult = {
          status: 'exists',
          message: '管理员账号已存在'
        }
        console.log('️管理员账号已存在')
      }
    } catch (err) {
      console.error('创建管理员失败:', err)
      adminResult = { status: 'error', message: err.message }
    }

    // 3. 添加示例数据
    let sampleDataResult = {}
    try {
      const jobCount = await db.collection('jobs').count()

      if (jobCount.total === 0) {
        const now = db.serverDate()
        const sampleJobs = [
          {
            jobName: '图书馆助理',
            department: '图书馆',
            jobType: '校内',
            workTime: '周一至周五下午 14:00-17:00',
            salary: 15,
            recruitNum: 10,
            status: 'recruiting',
            requirement: '细心负责，热爱阅读',
            jobContent: '图书整理、借还书协助、书架维护',
            requiredMajor: '',
            requiredGrade: '',
            minGpa: 2.5,
            contactPerson: '李老师',
            contactPhone: '010-12345678',
            contactEmail: 'library@university.edu.cn',
            publishDate: now,
            createTime: now,
            updateTime: now,
            createdBy: 'admin'
          },
          {
            jobName: '实验室助理',
            department: '计算机学院',
            jobType: '校内',
            workTime: '周二、周四晚上 19:00-21:00',
            salary: 20,
            recruitNum: 5,
            status: 'recruiting',
            requirement: '计算机相关专业，有编程基础',
            jobContent: '实验室设备维护、实验准备、技术支持',
            requiredMajor: '计算机科学与技术',
            requiredGrade: '2023级',
            minGpa: 3.0,
            contactPerson: '王老师',
            contactPhone: '010-87654321',
            contactEmail: 'lab@university.edu.cn',
            publishDate: now,
            createTime: now,
            updateTime: now,
            createdBy: 'admin'
          },
          {
            jobName: '行政办公室助理',
            department: '学生处',
            jobType: '校内',
            workTime: '周一、周三上午 9:00-12:00',
            salary: 18,
            recruitNum: 3,
            status: 'recruiting',
            requirement: '沟通能力好，熟练使用Office',
            jobContent: '文件整理、数据统计、接待咨询',
            requiredMajor: '',
            requiredGrade: '',
            minGpa: 2.5,
            contactPerson: '张老师',
            contactPhone: '010-11111111',
            contactEmail: 'student@university.edu.cn',
            publishDate: now,
            createTime: now,
            updateTime: now,
            createdBy: 'admin'
          }
        ]

        for (const job of sampleJobs) {
          await db.collection('jobs').add({ data: job })
        }

        sampleDataResult = {
          status: 'created',
          count: 3,
          message: '示例岗位数据添加成功'
        }
        console.log('✅ 示例岗位数据添加成功')
      } else {
        sampleDataResult = {
          status: 'exists',
          count: jobCount.total,
          message: '岗位数据已存在'
        }
        console.log('️  岗位数据已存在')
      }
    } catch (err) {
      console.error('添加示例数据失败:', err)
      sampleDataResult = { status: 'error', message: err.message }
    }

    // 4. 添加示例公告
    let noticeDataResult = {}
    try {
      const noticeCount = await db.collection('notices').count()

      if (noticeCount.total === 0) {
        const sampleNotices = [
          { title: '2026年春季勤工助学岗位开始申请', content: '各位同学，2026年春季学期勤工助学岗位已发布，请登录系统查看并申请。申请截止日期：2026年5月15日。', publishDate: db.serverDate(), publisher: '系统管理员' },
          { title: '图书馆助理岗位新增20个名额', content: '因工作需要，图书馆助理岗位新增20个名额，欢迎有意向的同学积极报名。', publishDate: db.serverDate(), publisher: '系统管理员' },
          { title: '关于规范勤工助学薪资发放的通知', content: '为保障同学们的权益，即日起勤工助学薪资将于每月15日前统一发放至银行卡，请确保个人信息中的银行卡号正确。', publishDate: db.serverDate(), publisher: '系统管理员' },
          { title: '五一假期勤工助学工作安排', content: '五一劳动节放假期间（5月1日-5月5日），所有勤工助学岗位暂停工作，假期后恢复正常。如有特殊情况请联系管理员。', publishDate: db.serverDate(), publisher: '系统管理员' },
          { title: '勤工助学岗前培训通知', content: '本学期新上岗同学须参加岗前培训，培训时间：4月20日下午2:00，地点：学生活动中心301室。', publishDate: db.serverDate(), publisher: '系统管理员' },
          { title: '计算机学院实验室助理招聘', content: '计算机学院新增3个实验室助理岗位，要求计算机相关专业，有编程基础者优先。薪资20元/时，欢迎申请。', publishDate: db.serverDate(), publisher: '系统管理员' },
          { title: '关于开展勤工助学优秀学生评选的通知', content: '为表彰在勤工助学中表现突出的同学，现开展本学期优秀勤工助学学生评选工作，请各岗位推荐1-2名候选人。', publishDate: db.serverDate(), publisher: '系统管理员' },
          { title: '勤工助学系统上线公告', content: '勤工助学岗位匹配管理系统已正式上线，支持Web端和微信小程序端。系统支持智能岗位匹配、在线申请、薪资查询等功能。', publishDate: db.serverDate(), publisher: '系统管理员' }
        ]
        for (const notice of sampleNotices) {
          await db.collection('notices').add({ data: notice })
        }
        noticeDataResult = {
          status: 'created',
          count: 3,
          message: '示例公告数据添加成功'
        }
        console.log('✅ 示例公告数据添加成功（' + sampleNotices.length + ' 条）')
      } else {
        noticeDataResult = {
          status: 'exists',
          count: noticeCount.total,
          message: '公告数据已存在'
        }
        console.log('️  公告数据已存在')
      }
    } catch (err) {
      console.error('添加示例公告失败:', err)
      noticeDataResult = { status: 'error', message: err.message }
    }

    return {
      code: 200,
      message: '数据库初始化完成',
      data: {
        collections: createResults,
        indexes: indexResults,
        admin: adminResult,
        sampleData: sampleDataResult,
        noticeData: noticeDataResult
      }
    }

  } catch (err) {
    console.error('初始化失败:', err)
    return {
      code: 500,
      message: '初始化失败: ' + err.message,
      error: err
    }
  }
}

/**
 * 创建索引的辅助函数
 */
async function createIndex(collectionName, keys, options = {}) {
  try {
    // 微信云开发使用createIndex API
    await db.collection(collectionName).createIndex(keys, options)
    console.log(`✅ 集合 [${collectionName}] 索引创建成功: ${JSON.stringify(keys)}`)
  } catch (err) {
    // 如果索引已存在或其他非致命错误，记录但继续执行
    const errMsg = err.message || JSON.stringify(err)
    if (errMsg.includes('already exists') || 
        errMsg.includes('already exist') ||
        err.errCode === -501001 ||
        err.errCode === -502001) {
      console.log(`ℹ️  集合 [${collectionName}] 索引已存在或无法创建: ${JSON.stringify(keys)}`)
    } else {
      console.error(`⚠️ 集合 [${collectionName}] 索引创建警告:`, errMsg)
      // 不抛出错误，允许初始化继续进行
    }
  }
}

/**
 * 重置数据库（清空所有数据）
 */
async function resetDatabase() {
  console.log('开始重置数据库...')

  try {
    const collections = ['users', 'jobs', 'applications', 'salary_records', 'system_logs', 'notices', 'match_config']

    for (const collectionName of collections) {
      try {
        const result = await db.collection(collectionName).where({}).remove()
        console.log(`✅ 集合 [${collectionName}] 已清空，删除 ${result.removed} 条记录`)
      } catch (err) {
        console.log(`ℹ️  集合 [${collectionName}] 清空失败或不存在`)
      }
    }

    return {
      code: 200,
      message: '数据库已重置',
      data: {
        message: '所有数据已清空，请重新运行初始化'
      }
    }

  } catch (err) {
    console.error('重置失败:', err)
    return {
      code: 500,
      message: '重置失败: ' + err.message
    }
  }
}
