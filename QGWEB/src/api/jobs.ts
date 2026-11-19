import { http } from './request'
import type { ApiResponse, Job, PageResponse, PageParams } from '@/types'

// 岗位列表参数
interface JobListParams extends PageParams {
  keyword?: string
  jobType?: string
  department?: string
  status?: string
  sortBy?: string
}

// 创建岗位参数
interface CreateJobParams {
  jobName: string
  department: string
  workTime: string
  salary: number
  jobType?: string
  recruitNum?: number
  requirement?: string
  jobContent?: string
  requiredMajor?: string
  requiredGrade?: string
  minGpa?: number
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
}

// 更新岗位参数
interface UpdateJobParams extends Partial<CreateJobParams> {
  jobId: string
}

/**
 * 岗位管理相关API
 * 对应微信小程序云函数: jobs
 */
export const jobsApi = {
  /**
   * 获取岗位列表
   * 云函数: jobs -> action: list
   */
  getJobList(params: JobListParams): Promise<ApiResponse<PageResponse<Job>>> {
    return http.get('/jobs/list', params)
  },

  /**
   * 获取岗位详情
   * 云函数: jobs -> action: detail
   */
  getJobDetail(jobId: string): Promise<ApiResponse<Job>> {
    return http.get('/jobs/detail', { jobId })
  },

  /**
   * 获取推荐岗位
   * 云函数: jobs -> action: recommend
   */
  getRecommendJobs(): Promise<ApiResponse<PageResponse<Job>>> {
    return http.get('/jobs/recommend')
  },

  /**
   * 创建岗位（管理员）
   * 云函数: jobs -> action: create
   */
  createJob(params: CreateJobParams): Promise<ApiResponse<{ jobId: string }>> {
    return http.post('/jobs/create', params)
  },

  /**
   * 更新岗位（管理员）
   * 云函数: jobs -> action: update
   */
  updateJob(params: UpdateJobParams): Promise<ApiResponse<null>> {
    return http.put('/jobs/update', params)
  },

  /**
   * 删除岗位（管理员）
   * 云函数: jobs -> action: delete
   */
  deleteJob(jobId: string): Promise<ApiResponse<null>> {
    return http.delete('/jobs/delete', { jobId })
  },

  /**
   * 切换岗位状态（管理员）
   * 云函数: jobs -> action: toggleStatus
   */
  toggleJobStatus(jobId: string, status: string): Promise<ApiResponse<null>> {
    return http.put('/jobs/toggle-status', { jobId, status })
  }
}
