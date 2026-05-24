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
  }
}
