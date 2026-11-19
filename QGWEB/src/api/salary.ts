import { http } from './request'
import type { ApiResponse, SalaryRecord, PageResponse, PageParams } from '@/types'

// 薪资查询参数
interface SalaryQueryParams {
  month?: string
}

// 记录工作时长参数
interface RecordWorkParams {
  studentId: string
  jobId: string
  workDate: string
  workHours: number
  hourlyRate: number
  jobName?: string
}

// 薪资列表参数
interface SalaryListParams extends PageParams {
  month?: string
  studentId?: string
}

// 发放薪资参数
interface PaySalaryParams {
  recordIds?: string[]
  month?: string
}

// 薪资查询响应
interface SalaryQueryResponse {
  totalSalary: number
  monthSalary: number
  totalHours: number
  currentJobCount: number
  monthData: {
    shouldPay: number
    actualPay: number
    workHours: number
    payStatus: string
    payStatusText: string
  }
  detailList: SalaryRecord[]
}

/**
 * 薪资管理相关API
 * 对应微信小程序云函数: salary
 */
export const salaryApi = {
  /**
   * 查询薪资信息
   * 云函数: salary -> action: query
   */
  querySalary(params?: SalaryQueryParams): Promise<ApiResponse<SalaryQueryResponse>> {
    return http.get('/salary/query', params)
  },

  /**
   * 记录工作时长（管理员）
   * 云函数: salary -> action: record
   */
  recordWork(params: RecordWorkParams): Promise<ApiResponse<null>> {
    return http.post('/salary/record', params)
  },

  /**
   * 计算薪资（管理员）
   * 云函数: salary -> action: calculate
   */
  calculateSalary(month?: string): Promise<ApiResponse<{ message: string }>> {
    return http.post('/salary/calculate', { month })
  },

  /**
   * 获取薪资列表（管理员）
   * 云函数: salary -> action: list
   */
  getSalaryList(params?: SalaryListParams): Promise<ApiResponse<PageResponse<SalaryRecord>>> {
    return http.get('/salary/list', params)
  },

  /**
   * 处理发放（管理员）
   * 云函数: salary -> action: adminPay
   */
  paySalary(params: PaySalaryParams): Promise<ApiResponse<null>> {
    return http.post('/salary/pay', params)
  },

  /**
   * 编辑薪资记录（管理员）
   */
  updateSalary(params: { recordId: string; workDate?: string; workHours?: number; hourlyRate?: number; jobName?: string; remark?: string }): Promise<ApiResponse<null>> {
    return http.put('/salary/update', params)
  },

  /**
   * 删除薪资记录（管理员）
   */
  deleteSalary(recordId: string): Promise<ApiResponse<null>> {
    return http.delete('/salary/delete', { recordId })
  }
}
