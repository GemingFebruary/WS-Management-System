// 用户信息类型
export interface UserInfo {
  userId: string
  name: string
  studentId?: string
  role: 'student' | 'admin'
  major?: string
  grade?: string
  phone?: string
  email?: string
  college?: string
  gender?: string
  familyType?: string
  familyDesc?: string
  gpa?: number
  freeTime?: string
  skills?: string[]
  experience?: string
  avatarUrl?: string
  status?: string
  createTime?: string
  updateTime?: string
  lastLoginTime?: string
}

// 岗位信息类型
export interface Job {
  _id: string
  jobId: string
  jobName: string
  department: string
  jobType: string
  workTime: string
  salary: number
  recruitNum: number
  status: 'recruiting' | 'full' | 'closed'
  statusText?: string
  publishDate: string
  requirement?: string
  jobContent?: string
  requiredMajor?: string
  requiredGrade?: string
  minGpa?: number
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  matchScore?: number
  createTime?: string
  updateTime?: string
  createdBy?: string
}

// 申请信息类型
export interface Application {
  _id: string
  applyId: string
  studentId: string
  studentName: string
  studentInfo?: {
    major?: string
    grade?: string
    phone?: string
    email?: string
    college?: string
    gender?: string
    familyType?: string
  }
  jobId: string
  jobName: string
  department: string
  phone?: string
  email?: string
  availableTime?: string
  experience?: string
  reason: string
  attachments?: string[]
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  statusText?: string
  applyTime: string
  reviewTime?: string
  rejectReason?: string
  reviewer?: string
}

// 薪资记录类型
export interface SalaryRecord {
  _id: string
  recordId?: string
  studentId: string
  jobId: string
  jobName: string
  workDate: string
  workHours: number
  hourlyRate: number
  amount: number
  month: string
  payStatus: 'paid' | 'unpaid'
  payStatusText?: string
  payDate?: string
  createTime?: string
  createdBy?: string
}

// API响应类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页参数类型
export interface PageParams {
  pageNum?: number
  pageSize?: number
}

// 分页响应类型
export interface PageResponse<T> {
  total: number
  list: T[]
}

// 统计数据类型
export interface Stats {
  jobCount: number
  pendingCount: number
  studentCount: number
  totalSalary: number
}

// 公告类型
export interface Notice {
  _id?: string
  noticeId?: string | number
  title: string
  content: string
  date?: string
  publishDate?: string
  publisher?: string
}
