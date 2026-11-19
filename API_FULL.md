# 勤工助学岗位匹配系统 - 完整API接口文档

## 基础信息

- **调用方式**: `wx.cloud.callFunction()`
- **数据格式**: JSON
- **认证方式**: 通过云函数内部验证用户openid和角色
- **统一响应格式**:
```javascript
{
  code: 200,           // 状态码：200成功，400请求错误，401未授权，403权限不足，404不存在，500服务器错误
  message: "success",  // 提示信息
  data: {}             // 返回数据
}
```

---

## 一、用户认证云函数 (auth)

### 1. 用户登录

**云函数名称**: `auth`  
**action**: `login`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'auth',
  data: {
    action: 'login',
    account: 'js23080509',      // 学号或管理员账号
    password: '123456',         // 密码
    role: 'student'             // 角色：student(学生) 或 admin(管理员)
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 是 | 账号（学生学号或管理员账号） |
| password | string | 是 | 密码 |
| role | string | 否 | 角色类型，默认'student' |

**响应示例**:
```javascript
{
  code: 200,
  message: "登录成功",
  data: {
    token: "base64编码的token字符串",
    userInfo: {
      userId: "js23080509",
      name: "侯胜勇",
      studentId: "js23080509",
      role: "student",
      major: "计算机科学与技术",
      grade: "2023级",
      phone: "13800138000",
      email: "test@example.com",
      college: "信息科学与工程",
      gender: "男",
      familyType: "一般",
      familyDesc: ""
    }
  }
}
```

**错误响应**:
- `401`: 账号或密码错误
- `400`: 账号和密码不能为空
- `500`: 登录失败

---

### 2. 学生注册

**云函数名称**: `auth`  
**action**: `register`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'auth',
  data: {
    action: 'register',
    studentId: 'js23080509',
    name: '侯胜勇',
    gender: '男',
    college: '信息科学与工程',
    major: '计算机科学与技术',
    grade: '2023级',
    phone: '13800138000',
    email: 'test@example.com',
    familyType: '一般',
    familyDesc: '',
    password: '123456'
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | string | 是 | 学号 |
| name | string | 是 | 姓名 |
| password | string | 是 | 密码（6-20位） |
| gender | string | 否 | 性别，默认空 |
| college | string | 否 | 学院 |
| major | string | 否 | 专业 |
| grade | string | 否 | 年级 |
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| familyType | string | 否 | 家庭类型：困难/特别困难/一般 |
| familyDesc | string | 否 | 家庭情况描述 |

**响应示例**:
```javascript
{
  code: 200,
  message: "注册成功",
  data: {
    userId: "js23080509"
  }
}
```

**错误响应**:
- `400`: 该学号已注册 / 学号、姓名和密码为必填项
- `500`: 注册失败

---

### 3. 用户登出

**云函数名称**: `auth`  
**action**: `logout`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'auth',
  data: {
    action: 'logout'
  }
})
```

**响应示例**:
```javascript
{
  code: 200,
  message: "登出成功",
  data: null
}
```

**错误响应**:
- `401`: 未登录
- `500`: 登出失败

---

### 4. 获取用户信息

**云函数名称**: `auth`  
**action**: `getUserInfo`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'auth',
  data: {
    action: 'getUserInfo'
  }
})
```

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    userId: "js23080509",
    name: "侯胜勇",
    studentId: "js23080509",
    role: "student",
    major: "计算机科学与技术",
    grade: "2023级",
    phone: "13800138000",
    email: "test@example.com",
    college: "信息科学与工程",
    gender: "男",
    familyType: "一般",
    familyDesc: "",
    gpa: 3.5,              // GPA（如果有）
    freeTime: "周一上午",   // 空闲时间（如果有）
    skills: [],            // 技能（如果有）
    experience: ""         // 经验（如果有）
  }
}
```

**错误响应**:
- `401`: 未登录
- `500`: 获取用户信息失败

---

## 二、岗位管理云函数 (jobs)

### 5. 获取岗位列表

**云函数名称**: `jobs`  
**action**: `list`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'list',
    keyword: '图书馆',           // 搜索关键词（可选）
    jobType: '校内',             // 岗位类型（可选）
    department: '图书馆',        // 部门（可选）
    status: 'recruiting',        // 状态（可选，默认recruiting）
    sortBy: 'publishDate',       // 排序方式（可选）
    pageNum: 1,                  // 页码（可选，默认1）
    pageSize: 10                 // 每页数量（可选，默认10）
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（匹配岗位名称、部门、工作内容） |
| jobType | string | 否 | 岗位类型：校内/校外 |
| department | string | 否 | 部门名称 |
| status | string | 否 | 状态：recruiting(招聘中)/full(已满员)/closed(已关闭) |
| sortBy | string | 否 | 排序：publishDate(发布时间)/salary(薪资)/recruitNum(招聘人数) |
| pageNum | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    total: 50,
    list: [
      {
        _id: "job_id_xxx",
        jobName: "图书馆助理",
        department: "图书馆",
        jobType: "校内",
        workTime: "周一至周五下午 14:00-17:00",
        salary: 15,
        recruitNum: 10,
        status: "recruiting",
        publishDate: "2026-04-15T00:00:00.000Z",
        requirement: "岗位要求...",
        jobContent: "工作内容...",
        requiredMajor: "计算机科学与技术",
        requiredGrade: "2023级",
        minGpa: 2.5,
        contactPerson: "李老师",
        contactPhone: "010-12345678",
        contactEmail: "library@university.edu.cn",
        matchScore: 85  // 仅登录后显示匹配度
      }
    ]
  }
}
```

**智能匹配算法**:
如果用户已登录且为学生身份，会自动计算匹配度：
- 专业匹配（30%权重）
- 年级匹配（20%权重）
- 成绩匹配（25%权重）
- 时间匹配（25%权重）

**错误响应**:
- `500`: 获取岗位列表失败

---

### 6. 获取岗位详情

**云函数名称**: `jobs`  
**action**: `detail`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'detail',
    jobId: 'job_id_xxx'
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| jobId | string | 是 | 岗位ID |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    _id: "job_id_xxx",
    jobName: "图书馆助理",
    department: "图书馆",
    jobType: "校内",
    workTime: "周一至周五下午 14:00-17:00",
    salary: 15,
    recruitNum: 10,
    status: "recruiting",
    publishDate: "2026-04-15T00:00:00.000Z",
    requirement: "岗位要求详细内容...",
    jobContent: "工作内容详细描述...",
    requiredMajor: "计算机科学与技术",
    requiredGrade: "2023级",
    minGpa: 2.5,
    contactPerson: "李老师",
    contactPhone: "010-12345678",
    contactEmail: "library@university.edu.cn",
    createTime: "2026-04-15T00:00:00.000Z",
    updateTime: "2026-04-15T00:00:00.000Z",
    createdBy: "admin001",
    matchScore: 85  // 仅登录后显示
  }
}
```

**错误响应**:
- `400`: 岗位ID不能为空
- `404`: 岗位不存在
- `500`: 获取岗位详情失败

---

### 7. 获取推荐岗位

**云函数名称**: `jobs`  
**action**: `recommend`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'recommend'
  }
})
```

**说明**: 
- 需要登录（学生身份）
- 返回所有招聘中岗位按匹配度排序的前10个

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    total: 10,
    list: [
      // 同岗位列表格式，按matchScore降序排列
    ]
  }
}
```

**错误响应**:
- `401`: 请先登录
- `500`: 获取推荐岗位失败

---

### 8. 创建岗位（管理员）

**云函数名称**: `jobs`  
**action**: `create`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'create',
    jobName: '图书馆助理',
    department: '图书馆',
    jobType: '校内',
    workTime: '周一至周五下午 14:00-17:00',
    salary: 15,
    recruitNum: 10,
    requirement: '岗位要求...',
    jobContent: '工作内容...',
    requiredMajor: '计算机科学与技术',
    requiredGrade: '2023级',
    minGpa: 2.5,
    contactPerson: '李老师',
    contactPhone: '010-12345678',
    contactEmail: 'library@university.edu.cn'
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| jobName | string | 是 | 岗位名称 |
| department | string | 是 | 部门 |
| workTime | string | 是 | 工作时间 |
| salary | number | 是 | 时薪 |
| jobType | string | 否 | 岗位类型，默认'校内' |
| recruitNum | number | 否 | 招聘人数，默认1 |
| requirement | string | 否 | 岗位要求 |
| jobContent | string | 否 | 工作内容 |
| requiredMajor | string | 否 | 要求专业 |
| requiredGrade | string | 否 | 要求年级 |
| minGpa | number | 否 | 最低GPA |
| contactPerson | string | 否 | 联系人 |
| contactPhone | string | 否 | 联系电话 |
| contactEmail | string | 否 | 联系邮箱 |

**响应示例**:
```javascript
{
  code: 200,
  message: "岗位发布成功",
  data: {
    jobId: "job_id_xxx"
  }
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 岗位名称、部门、工作时间和薪资为必填项
- `500`: 发布岗位失败

---

### 9. 更新岗位（管理员）

**云函数名称**: `jobs`  
**action**: `update`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'update',
    jobId: 'job_id_xxx',
    jobName: '图书馆助理（更新）',
    salary: 18,
    recruitNum: 15
    // 其他需要更新的字段...
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| jobId | string | 是 | 岗位ID |
| ... | any | 否 | 其他需要更新的字段（除_id、publishDate、createTime、createdBy外） |

**响应示例**:
```javascript
{
  code: 200,
  message: "岗位更新成功",
  data: null
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 岗位ID不能为空
- `500`: 更新岗位失败

---

### 10. 删除岗位（管理员）

**云函数名称**: `jobs`  
**action**: `delete`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'delete',
    jobId: 'job_id_xxx'
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| jobId | string | 是 | 岗位ID |

**响应示例**:
```javascript
{
  code: 200,
  message: "岗位删除成功",
  data: null
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 岗位ID不能为空
- `500`: 删除岗位失败

---

### 11. 切换岗位状态（管理员）

**云函数名称**: `jobs`  
**action**: `toggleStatus`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'toggleStatus',
    jobId: 'job_id_xxx',
    status: 'closed'  // recruiting/full/closed
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| jobId | string | 是 | 岗位ID |
| status | string | 是 | 状态：recruiting(招聘中)/full(已满员)/closed(已关闭) |

**响应示例**:
```javascript
{
  code: 200,
  message: "状态更新成功",
  data: null
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 岗位ID和状态不能为空
- `500`: 更新状态失败

---

## 三、申请管理云函数 (applications)

### 12. 提交申请

**云函数名称**: `applications`  
**action**: `submit`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'applications',
  data: {
    action: 'submit',
    jobId: 'job_id_xxx',
    phone: '13800138000',
    email: 'test@example.com',
    availableTime: '周一上午',
    experience: '相关经验...',
    reason: '申请理由...',
    attachments: []
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| jobId | string | 是 | 岗位ID |
| reason | string | 是 | 申请理由 |
| phone | string | 否 | 联系电话（默认使用用户信息中的电话） |
| email | string | 否 | 邮箱（默认使用用户信息中的邮箱） |
| availableTime | string | 否 | 可工作时间 |
| experience | string | 否 | 相关经验 |
| attachments | array | 否 | 附件列表 |

**响应示例**:
```javascript
{
  code: 200,
  message: "申请提交成功",
  data: {
    applyId: "application_id_xxx"
  }
}
```

**错误响应**:
- `401`: 请先以学生身份登录
- `400`: 岗位ID和申请理由为必填项 / 您已经申请过该岗位 / 该岗位已停止招聘
- `404`: 岗位不存在
- `500`: 提交申请失败

---

### 13. 获取我的申请列表

**云函数名称**: `applications`  
**action**: `myApplications`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'applications',
  data: {
    action: 'myApplications',
    status: 'pending'  // 可选：pending/approved/rejected/cancelled
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选：pending(待审核)/approved(已通过)/rejected(已驳回)/cancelled(已取消) |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: [
    {
      _id: "application_id_xxx",
      studentId: "js23080509",
      studentName: "侯胜勇",
      studentInfo: {
        major: "计算机科学与技术",
        grade: "2023级",
        phone: "13800138000",
        email: "test@example.com",
        college: "信息科学与工程",
        gender: "男",
        familyType: "一般"
      },
      jobId: "job_id_xxx",
      jobName: "图书馆助理",
      department: "图书馆",
      phone: "13800138000",
      email: "test@example.com",
      availableTime: "周一上午",
      experience: "相关经验...",
      reason: "申请理由...",
      attachments: [],
      status: "pending",
      statusText: "待审核",
      applyTime: "2026-04-15T10:30:00.000Z",
      reviewTime: null,
      rejectReason: "",
      reviewer: ""
    }
  ]
}
```

**错误响应**:
- `401`: 请先以学生身份登录
- `500`: 获取申请列表失败

---

### 14. 获取申请详情

**云函数名称**: `applications`  
**action**: `detail`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'applications',
  data: {
    action: 'detail',
    applyId: 'application_id_xxx'
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| applyId | string | 是 | 申请ID |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    // 同申请列表中的单个申请对象
  }
}
```

**错误响应**:
- `401`: 请先登录 / 无权查看此申请
- `400`: 申请ID不能为空
- `404`: 申请记录不存在
- `500`: 获取申请详情失败

---

### 15. 审核申请（管理员）

**云函数名称**: `applications`  
**action**: `review`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'applications',
  data: {
    action: 'review',
    applyId: 'application_id_xxx',
    action: 'approve',           // approve(通过) 或 reject(驳回)
    rejectReason: '不符合要求'   // 仅在驳回时填写
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| applyId | string | 是 | 申请ID |
| action | string | 是 | 操作：approve(通过) / reject(驳回) |
| rejectReason | string | 否 | 驳回理由（仅在action='reject'时需要） |

**响应示例**:
```javascript
{
  code: 200,
  message: "审核通过",  // 或 "已驳回"
  data: null
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 申请ID和操作不能为空 / 操作类型错误
- `404`: 申请记录不存在
- `500`: 审核失败

---

### 16. 获取申请列表（管理员）

**云函数名称**: `applications`  
**action**: `adminList`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'applications',
  data: {
    action: 'adminList',
    status: 'pending',     // 可选：状态筛选
    jobId: 'job_id_xxx'    // 可选：岗位筛选
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选 |
| jobId | string | 否 | 岗位ID筛选 |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: [
    // 同申请列表格式
  ]
}
```

**错误响应**:
- `401`: 需要管理员权限
- `500`: 获取申请列表失败

---

### 17. 取消申请

**云函数名称**: `applications`  
**action**: `cancel`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'applications',
  data: {
    action: 'cancel',
    applyId: 'application_id_xxx'
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| applyId | string | 是 | 申请ID |

**响应示例**:
```javascript
{
  code: 200,
  message: "申请已取消",
  data: null
}
```

**错误响应**:
- `401`: 请先以学生身份登录 / 无权操作此申请
- `400`: 申请ID不能为空 / 只能取消待审核的申请
- `404`: 申请记录不存在
- `500`: 取消申请失败

---

## 四、薪资管理云函数 (salary)

### 18. 查询薪资信息

**云函数名称**: `salary`  
**action**: `query`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'salary',
  data: {
    action: 'query',
    month: '2026-04'  // 可选，默认当前月份
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| month | string | 否 | 月份，格式YYYY-MM，默认当前月份 |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    totalSalary: 1200,        // 累计已发放薪资
    monthSalary: 480,         // 当月薪资
    totalHours: 0,            // 总工时（预留字段）
    currentJobCount: 2,       // 当前在岗岗位数
    monthData: {
      shouldPay: 480,         // 应发薪资
      actualPay: 480,         // 实发薪资
      workHours: 32,          // 当月工时
      payStatus: "paid",      // paid(已发放)/unpaid(未发放)
      payStatusText: "已发放"
    },
    detailList: [
      {
        recordId: "record_id_xxx",
        jobName: "图书馆助理",
        workDate: "2026-04-15",
        workHours: 4,
        hourlyRate: 15,
        amount: 60,
        payStatus: "paid",
        payDate: "2026-04-20"
      }
    ]
  }
}
```

**错误响应**:
- `401`: 请先以学生身份登录
- `500`: 查询薪资失败

---

### 19. 记录工作时长（管理员）

**云函数名称**: `salary`  
**action**: `record`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'salary',
  data: {
    action: 'record',
    studentId: 'js23080509',
    jobId: 'job_id_xxx',
    jobName: '图书馆助理',
    workDate: '2026-04-15',
    workHours: 4,
    hourlyRate: 15
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | string | 是 | 学生学号 |
| jobId | string | 是 | 岗位ID |
| workDate | string | 是 | 工作日期，格式YYYY-MM-DD |
| workHours | number | 是 | 工作时长（小时） |
| hourlyRate | number | 是 | 时薪 |
| jobName | string | 否 | 岗位名称 |

**响应示例**:
```javascript
{
  code: 200,
  message: "工作时长记录成功",
  data: null
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 缺少必要参数
- `500`: 记录工作时长失败

---

### 20. 计算薪资（管理员）

**云函数名称**: `salary`  
**action**: `calculate`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'salary',
  data: {
    action: 'calculate',
    month: '2026-04'  // 可选，默认当前月份
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| month | string | 否 | 月份，格式YYYY-MM |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    message: "已计算2026-04月份薪资"
  }
}
```

**说明**: 当前版本仅返回提示信息，可扩展实现批量计算逻辑。

**错误响应**:
- `401`: 需要管理员权限
- `500`: 计算薪资失败

---

### 21. 获取薪资列表（管理员）

**云函数名称**: `salary`  
**action**: `list`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'salary',
  data: {
    action: 'list',
    month: '2026-04',
    studentId: 'js23080509',
    pageNum: 1,
    pageSize: 20
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| month | string | 否 | 月份筛选 |
| studentId | string | 否 | 学生学号筛选 |
| pageNum | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    total: 100,
    list: [
      {
        _id: "record_id_xxx",
        studentId: "js23080509",
        jobId: "job_id_xxx",
        jobName: "图书馆助理",
        workDate: "2026-04-15",
        workHours: 4,
        hourlyRate: 15,
        amount: 60,
        month: "2026-04",
        payStatus: "unpaid",
        payDate: null,
        createTime: "2026-04-15T10:00:00.000Z",
        createdBy: "admin001"
      }
    ]
  }
}
```

**错误响应**:
- `401`: 需要管理员权限
- `500`: 获取薪资列表失败

---

### 22. 处理发放（管理员）

**云函数名称**: `salary`  
**action**: `adminPay`

**调用示例**:
```javascript
// 按记录ID发放
wx.cloud.callFunction({
  name: 'salary',
  data: {
    action: 'adminPay',
    recordIds: ['record_id_1', 'record_id_2']
  }
})

// 按月份批量发放
wx.cloud.callFunction({
  name: 'salary',
  data: {
    action: 'adminPay',
    month: '2026-04'
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| recordIds | array | 条件必填 | 记录ID数组 |
| month | string | 条件必填 | 月份（格式YYYY-MM） |

**说明**: recordIds和month至少提供一个。如果同时提供，优先使用recordIds。

**响应示例**:
```javascript
{
  code: 200,
  message: "薪资发放成功",
  data: null
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 请提供记录ID或月份
- `500`: 薪资发放失败

---

## 五、管理员后台云函数 (admin)

### 23. 获取统计数据

**云函数名称**: `admin`  
**action**: `stats`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'admin',
  data: {
    action: 'stats'
  }
})
```

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    jobCount: 45,           // 岗位总数
    pendingCount: 12,       // 待审核申请数
    studentCount: 328,      // 学生总数
    totalSalary: 15600      // 本月薪资发放总额
  }
}
```

**错误响应**:
- `401`: 需要管理员权限
- `500`: 获取统计数据失败

---

### 24. 获取学生列表（管理员）

**云函数名称**: `admin`  
**action**: `studentList`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'admin',
  data: {
    action: 'studentList',
    keyword: '侯胜勇',    // 可选：搜索关键词
    pageNum: 1,
    pageSize: 20
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（匹配学号、姓名、专业） |
| pageNum | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    total: 328,
    list: [
      {
        _id: "user_id_xxx",
        userId: "js23080509",
        studentId: "js23080509",
        name: "侯胜勇",
        gender: "男",
        college: "信息科学与工程",
        major: "计算机科学与技术",
        grade: "2023级",
        phone: "13800138000",
        email: "test@example.com",
        familyType: "一般",
        familyDesc: "",
        role: "student",
        status: "active",
        createTime: "2026-04-01T00:00:00.000Z",
        updateTime: "2026-04-01T00:00:00.000Z",
        lastLoginTime: "2026-04-15T10:00:00.000Z"
        // 注意：不包含password和openid
      }
    ]
  }
}
```

**错误响应**:
- `401`: 需要管理员权限
- `500`: 获取学生列表失败

---

### 25. 更新学生信息（管理员）

**云函数名称**: `admin`  
**action**: `updateStudent`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'admin',
  data: {
    action: 'updateStudent',
    userId: 'js23080509',
    phone: '13900139000',
    email: 'newemail@example.com'
    // 其他需要更新的字段...
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |
| ... | any | 否 | 其他需要更新的字段（除_id、password、openid、createTime外） |

**响应示例**:
```javascript
{
  code: 200,
  message: "更新成功",
  data: null
}
```

**错误响应**:
- `401`: 需要管理员权限
- `400`: 用户ID不能为空
- `500`: 更新失败

---

### 26. 导出数据（管理员）

**云函数名称**: `admin`  
**action**: `exportData`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'admin',
  data: {
    action: 'exportData',
    type: 'applications'  // applications/students/salary
  }
})
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 导出类型：applications(申请记录)/students(学生信息)/salary(薪资记录)，默认'applications' |

**响应示例**:
```javascript
{
  code: 200,
  message: "success",
  data: {
    type: "applications",
    count: 150,
    data: [
      // 完整的数据数组
    ]
  }
}
```

**错误响应**:
- `401`: 需要管理员权限
- `500`: 导出数据失败

---

## 六、数据库初始化云函数 (initDB)

### 27. 初始化数据库

**云函数名称**: `initDB`  
**action**: `init`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'initDB',
  data: {
    action: 'init'
  }
})
```

**响应示例**:
```javascript
{
  code: 200,
  message: "数据库初始化完成",
  data: {
    collections: ["users", "jobs", "applications", "salary_records", "system_logs"],
    adminAccount: "admin",
    exampleJobs: 5,
    exampleStudents: 3
  }
}
```

**说明**: 
- 创建所有必需的数据库集合
- 创建默认管理员账号（账号：admin，密码：admin123，（⚠️ 仅开发环境默认，部署后必须立即修改））
- 插入示例数据

**错误响应**:
- `500`: 初始化失败

---

### 28. 重置数据库

**云函数名称**: `initDB`  
**action**: `reset`

**调用示例**:
```javascript
wx.cloud.callFunction({
  name: 'initDB',
  data: {
    action: 'reset'
  }
})
```

**警告**: 此操作会清空所有数据并重新初始化！

**响应示例**:
```javascript
{
  code: 200,
  message: "数据库重置完成",
  data: {
    // 同初始化响应
  }
}
```

**错误响应**:
- `500`: 重置失败

---

## 七、数据库集合结构

### users 集合（用户信息）

```javascript
{
  _id: "user_id_xxx",
  userId: "js23080509",         // 用户ID（学生为学号）
  studentId: "js23080509",      // 学号
  name: "侯胜勇",               // 姓名
  gender: "男",                 // 性别
  college: "信息科学与工程",     // 学院
  major: "计算机科学与技术",     // 专业
  grade: "2023级",              // 年级
  phone: "13800138000",         // 手机号
  email: "test@example.com",    // 邮箱
  familyType: "一般",           // 家庭类型
  familyDesc: "",               // 家庭情况描述
  password: "$2b$10$xxx",       // bcrypt加密的密码
  role: "student",              // 角色：student/admin
  openid: "xxx",                // 微信openid
  status: "active",             // 状态
  gpa: 3.5,                     // GPA（可选）
  freeTime: "周一上午",          // 空闲时间（可选）
  skills: [],                   // 技能（可选）
  experience: "",               // 经验（可选）
  createTime: db.serverDate(),  // 创建时间
  updateTime: db.serverDate(),  // 更新时间
  lastLoginTime: db.serverDate() // 最后登录时间
}
```

### jobs 集合（岗位信息）

```javascript
{
  _id: "job_id_xxx",
  jobName: "图书馆助理",         // 岗位名称
  department: "图书馆",          // 部门
  jobType: "校内",              // 岗位类型
  workTime: "周一至周五下午",     // 工作时间
  salary: 15,                   // 时薪
  recruitNum: 10,               // 招聘人数
  status: "recruiting",         // 状态：recruiting/full/closed
  requirement: "岗位要求...",    // 岗位要求
  jobContent: "工作内容...",     // 工作内容
  requiredMajor: "",            // 要求专业
  requiredGrade: "",            // 要求年级
  minGpa: 2.5,                  // 最低GPA
  contactPerson: "李老师",       // 联系人
  contactPhone: "010-12345678", // 联系电话
  contactEmail: "xxx@xxx.com",  // 联系邮箱
  publishDate: db.serverDate(), // 发布时间
  createTime: db.serverDate(),  // 创建时间
  updateTime: db.serverDate(),  // 更新时间
  createdBy: "admin001"         // 创建人
}
```

### applications 集合（申请记录）

```javascript
{
  _id: "application_id_xxx",
  studentId: "js23080509",      // 学生学号
  studentName: "侯胜勇",         // 学生姓名
  studentInfo: {                // 学生信息快照
    major: "计算机科学与技术",
    grade: "2023级",
    phone: "13800138000",
    email: "test@example.com",
    college: "信息科学与工程",
    gender: "男",
    familyType: "一般"
  },
  jobId: "job_id_xxx",          // 岗位ID
  jobName: "图书馆助理",         // 岗位名称
  department: "图书馆",          // 部门
  phone: "13800138000",         // 联系电话
  email: "test@example.com",    // 邮箱
  availableTime: "周一上午",     // 可工作时间
  experience: "相关经验...",     // 相关经验
  reason: "申请理由...",         // 申请理由
  attachments: [],              // 附件
  status: "pending",            // 状态：pending/approved/rejected/cancelled
  statusText: "待审核",          // 状态文本
  applyTime: db.serverDate(),   // 申请时间
  reviewTime: null,             // 审核时间
  rejectReason: "",             // 驳回理由
  reviewer: ""                  // 审核人
}
```

### salary_records 集合（薪资记录）

```javascript
{
  _id: "record_id_xxx",
  studentId: "js23080509",      // 学生学号
  jobId: "job_id_xxx",          // 岗位ID
  jobName: "图书馆助理",         // 岗位名称
  workDate: "2026-04-15",       // 工作日期
  workHours: 4,                 // 工作时长（小时）
  hourlyRate: 15,               // 时薪
  amount: 60,                   // 金额
  month: "2026-04",             // 月份
  payStatus: "unpaid",          // 发放状态：unpaid/paid
  payDate: null,                // 发放日期
  createTime: db.serverDate(),  // 创建时间
  updateTime: db.serverDate(),  // 更新时间
  createdBy: "admin001"         // 创建人
}
```

### system_logs 集合（系统日志）

```javascript
{
  _id: "log_id_xxx",
  type: "login",                // 日志类型
  userId: "js23080509",         // 用户ID
  action: "用户登录",            // 操作
  details: {},                  // 详细信息
  createTime: db.serverDate()   // 创建时间
}
```

---

## 八、数据库权限配置

在云开发控制台配置各集合的安全规则：

### users 集合
```json
{
  "read": true,
  "write": false
}
```

### jobs 集合
```json
{
  "read": true,
  "write": false
}
```

### applications 集合
```json
{
  "read": false,
  "write": false
}
```

### salary_records 集合
```json
{
  "read": false,
  "write": false
}
```

### system_logs 集合
```json
{
  "read": false,
  "write": false
}
```

**说明**: 
- `read: true` 允许前端直接读取（用于公开数据如岗位列表）
- `write: false` 禁止前端直接写入，所有写操作必须通过云函数
- applications、salary_records、system_logs 设置为完全私有，只能通过云函数访问

---

## 九、工具方法 (utils/util.js)

项目提供了便捷的工具方法简化云函数调用：

```javascript
const { callAuth, callJobs, callApplications, callSalary, callAdmin } = require('../../utils/util')

// 示例：登录
await callAuth('login', { account, password, role })

// 示例：获取岗位列表
await callJobs('list', { status: 'recruiting', pageNum: 1, pageSize: 10 })

// 示例：提交申请
await callApplications('submit', { jobId, reason, ... })

// 示例：查询薪资
await callSalary('query', { month: '2026-04' })

// 示例：获取统计数据
await callAdmin('stats')
```

这些方法自动处理：
- 统一的错误提示
- Promise封装
- 响应码检查

---

## 十、常见问题

### 1. 云函数调用失败

**可能原因**:
- 云函数未上传部署
- app.js中环境ID配置错误
- 网络连接问题

**解决方法**:
- 右键云函数文件夹 → "上传并部署：云端安装依赖"
- 检查app.js第8行的env配置
- 查看云函数日志排查错误

### 2. 数据库操作失败

**可能原因**:
- 集合未创建
- 权限配置不正确
- 字段类型不匹配

**解决方法**:
- 使用initDB云函数初始化数据库
- 检查云开发控制台的权限配置
- 查看错误日志确认具体原因

### 3. 权限不足

**说明**: 
- 所有写操作（增删改）都必须通过云函数
- 部分读操作（如申请记录、薪资记录）也只能通过云函数
- 确保用户已登录且具有相应角色权限

### 4. 智能匹配度不显示

**可能原因**:
- 用户未登录
- 用户信息不完整（缺少专业、年级等）

**解决方法**:
- 确保登录后再访问岗位列表
- 完善用户个人信息

---

## 十一、优化建议

### 1. 接口层面优化

#### (1) 增加分页支持
**现状**: applications、salary等接口的列表查询缺少分页
**建议**: 为以下接口添加pageNum和pageSize参数
- `applications.myApplications`
- `applications.adminList`
- `salary.list`

#### (2) 统一参数命名
**现状**: 部分接口使用jobId，部分使用_id
**建议**: 统一使用jobId、applyId、recordId等业务ID，避免暴露MongoDB的_id

#### (3) 增加批量操作接口
**现状**: 审核申请只能单个处理
**建议**: 增加批量审核接口
```javascript
{
  action: 'batchReview',
  applyIds: ['id1', 'id2', 'id3'],
  action: 'approve'
}
```

### 2. 安全性优化

#### (1) Token机制增强
**现状**: 使用简单的base64编码token
**建议**: 
- 使用JWT（JSON Web Token）
- 添加过期时间（如24小时）
- 实现token刷新机制

#### (2) 敏感信息保护
**现状**: 用户信息返回可能包含过多字段
**建议**: 
- 严格过滤返回字段
- 不在前端存储明文密码（已实现）
- 增加敏感操作二次验证

#### (3) 防重复提交
**现状**: 申请提交仅检查是否已申请
**建议**: 
- 增加防抖机制
- 使用事务确保原子性

### 3. 性能优化

#### (1) 数据库索引
**建议创建以下索引**:
```javascript
// users集合
db.collection('users').createIndex({ studentId: 1 }, { unique: true })
db.collection('users').createIndex({ openid: 1 })

// jobs集合
db.collection('jobs').createIndex({ status: 1, publishDate: -1 })
db.collection('jobs').createIndex({ department: 1 })

// applications集合
db.collection('applications').createIndex({ studentId: 1, status: 1 })
db.collection('applications').createIndex({ jobId: 1 })

// salary_records集合
db.collection('salary_records').createIndex({ studentId: 1, month: 1 })
db.collection('salary_records').createIndex({ payStatus: 1 })
```

#### (2) 缓存机制
**建议**:
- 岗位列表增加缓存（5分钟）
- 用户信息增加本地缓存
- 统计数据增加缓存（1小时）

#### (3) 懒加载优化
**现状**: 岗位详情页一次性加载所有数据
**建议**: 
- 基本信息先展示
- 详细内容（如工作要求）异步加载

### 4. 功能扩展建议

#### (1) 消息通知
**建议增加**:
- 申请审核结果通知
- 新岗位发布通知
- 薪资发放通知

#### (2) 数据统计
**建议增加**:
- 学生端：申请成功率统计、工作时长趋势
- 管理员端：岗位热度分析、学生活跃度

#### (3) 文件上传
**现状**: attachments字段预留但未实现
**建议**: 
- 集成云存储
- 支持简历、证书等附件上传

#### (4) 评价系统
**建议增加**:
- 学生对岗位的评价
- 管理员对学生的评价
- 双向评分机制

---

## 十二、版本历史

- **v1.0** (2026-05-23): 初始版本，包含基础认证、岗位管理、申请管理、薪资管理功能

---

## 附录：快速参考表

| 云函数 | Action | 功能 | 权限要求 |
|--------|--------|------|----------|
| auth | login | 用户登录 | 无 |
| auth | register | 学生注册 | 无 |
| auth | logout | 用户登出 | 已登录 |
| auth | getUserInfo | 获取用户信息 | 已登录 |
| jobs | list | 获取岗位列表 | 无 |
| jobs | detail | 获取岗位详情 | 无 |
| jobs | recommend | 获取推荐岗位 | 学生登录 |
| jobs | create | 创建岗位 | 管理员 |
| jobs | update | 更新岗位 | 管理员 |
| jobs | delete | 删除岗位 | 管理员 |
| jobs | toggleStatus | 切换岗位状态 | 管理员 |
| applications | submit | 提交申请 | 学生登录 |
| applications | myApplications | 我的申请列表 | 学生登录 |
| applications | detail | 申请详情 | 已登录且本人或管理员 |
| applications | review | 审核申请 | 管理员 |
| applications | adminList | 申请列表 | 管理员 |
| applications | cancel | 取消申请 | 学生登录且本人 |
| salary | query | 查询薪资 | 学生登录 |
| salary | record | 记录工作时长 | 管理员 |
| salary | calculate | 计算薪资 | 管理员 |
| salary | list | 薪资列表 | 管理员 |
| salary | adminPay | 处理发放 | 管理员 |
| admin | stats | 统计数据 | 管理员 |
| admin | studentList | 学生列表 | 管理员 |
| admin | updateStudent | 更新学生信息 | 管理员 |
| admin | exportData | 导出数据 | 管理员 |
| initDB | init | 初始化数据库 | 无（建议限制） |
| initDB | reset | 重置数据库 | 无（建议限制） |

---

**文档维护**: 如有接口变更，请及时更新本文档  
**最后更新**: 2026-05-23
