import { http } from './request'
import type { ApiResponse, UserInfo, Stats, PageResponse, PageParams } from '@/types'

// 学生列表参数
interface StudentListParams extends PageParams {
  keyword?: string
}

// 更新学生信息参数
interface UpdateStudentParams {
  userId: string
  [key: string]: any
}

// 导出数据参数
interface ExportDataParams {
  type?: 'applications' | 'students' | 'salary'
}

/**
 * 管理员后台相关API
 * 对应微信小程序云函数: admin
 */
export const adminApi = {
  /**
   * 获取统计数据
   * 云函数: admin -> action: stats
   */
  getStats(): Promise<ApiResponse<Stats>> {
    return http.get('/admin/stats')
  },

  /**
   * 获取学生列表（管理员）
   * 云函数: admin -> action: studentList
   */
  getStudentList(params?: StudentListParams): Promise<ApiResponse<PageResponse<UserInfo>>> {
    return http.get('/admin/student-list', params)
  },

  /**
   * 更新学生信息（管理员）
   * 云函数: admin -> action: updateStudent
   */
  updateStudent(params: UpdateStudentParams): Promise<ApiResponse<null>> {
    return http.put('/admin/update-student', params)
  },

  /**
   * 导出数据（管理员）
   * 云函数: admin -> action: exportData
   */
  exportData(params?: ExportDataParams): Promise<ApiResponse<{ type: string; count: number; data: any[] }>> {
    return http.get('/admin/export-data', params)
  },

  /**
   * 获取公告列表
   * 云函数: admin -> action: getNotices
   */
  getNotices(): Promise<ApiResponse<{ list: any[] }>> {
    return http.get('/admin/notices')
  },

  /**
   * 发布公告
   */
  publishNotice(params: { title: string; content: string }): Promise<ApiResponse<any>> {
    return http.post('/admin/notices', params)
  },

  /**
   * 更新公告
   */
  updateNotice(noticeId: string, params: { title?: string; content?: string }): Promise<ApiResponse<null>> {
    return http.put(`/admin/notices/${noticeId}`, params)
  },

  /**
   * 删除公告
   */
  deleteNotice(noticeId: string): Promise<ApiResponse<null>> {
    return http.delete(`/admin/notices/${noticeId}`)
  },

  /**
   * 发薪清单导出（管理员）
   */
  exportPayroll(params: { month: string; payStatus?: string }): Promise<ApiResponse<any>> {
    return http.get('/admin/payroll-export', params)
  }
}
