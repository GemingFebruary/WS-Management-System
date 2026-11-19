import { http } from './request'
import type { ApiResponse, Application, PageResponse, PageParams } from '@/types'

// 提交申请参数
interface SubmitApplicationParams {
  jobId: string
  reason: string
  phone?: string
  email?: string
  availableTime?: string
  experience?: string
  attachments?: string[]
}

// 审核申请参数
interface ReviewApplicationParams {
  applyId: string
  action: 'approve' | 'reject'
  rejectReason?: string
}

// 申请列表参数
interface ApplicationListParams extends PageParams {
  status?: string
  jobId?: string
}

/**
 * 申请管理相关API
 * 对应微信小程序云函数: applications
 */
export const applicationsApi = {
  /**
   * 提交申请
   * 云函数: applications -> action: submit
   */
  submitApplication(params: SubmitApplicationParams): Promise<ApiResponse<{ applyId: string }>> {
    return http.post('/applications/submit', params)
  },

  /**
   * 获取我的申请列表
   * 云函数: applications -> action: myApplications
   */
  getMyApplications(params?: ApplicationListParams): Promise<ApiResponse<PageResponse<Application>>> {
    return http.get('/applications/my-applications', params)
  },

  /**
   * 获取申请详情
   * 云函数: applications -> action: detail
   */
  getApplicationDetail(applyId: string): Promise<ApiResponse<Application>> {
    return http.get('/applications/detail', { applyId })
  },

  /**
   * 审核申请（管理员）
   * 云函数: applications -> action: review
   */
  reviewApplication(params: ReviewApplicationParams): Promise<ApiResponse<null>> {
    return http.post('/applications/review', params)
  },

  /**
   * 获取申请列表（管理员）
   * 云函数: applications -> action: adminList
   */
  getAdminApplicationList(params?: ApplicationListParams): Promise<ApiResponse<PageResponse<Application>>> {
    return http.get('/applications/admin-list', params)
  },

  /**
   * 取消申请
   * 云函数: applications -> action: cancel
   */
  cancelApplication(applyId: string): Promise<ApiResponse<null>> {
    return http.post('/applications/cancel', { applyId })
  }
}
