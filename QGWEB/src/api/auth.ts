import { http } from './request'
import type { ApiResponse, UserInfo } from '@/types'

// 登录参数
interface LoginParams {
  account: string
  password: string
  role: string
}

// 登录响应
interface LoginResponse {
  token: string
  userInfo: UserInfo
}

// 注册参数
interface RegisterParams {
  studentId: string
  name: string
  password: string
  gender?: string
  college?: string
  major?: string
  grade?: string
  phone?: string
  email?: string
  familyType?: string
  familyDesc?: string
}

/**
 * 用户认证相关API
 * 对应微信小程序云函数: auth
 */
export const authApi = {
  /**
   * 用户登录
   * 云函数: auth -> action: login
   */
  login(params: LoginParams): Promise<ApiResponse<LoginResponse>> {
    return http.post('/auth/login', params)
  },

  /**
   * 学生注册
   * 云函数: auth -> action: register
   */
  register(params: RegisterParams): Promise<ApiResponse<{ userId: string }>> {
    return http.post('/auth/register', params)
  },

  /**
   * 用户登出
   * 云函数: auth -> action: logout
   */
  logout(): Promise<ApiResponse<null>> {
    return http.post('/auth/logout')
  },

  /**
   * 获取用户信息
   * 云函数: auth -> action: getUserInfo
   */
  getUserInfo(): Promise<ApiResponse<UserInfo>> {
    return http.get('/auth/user-info')
  },

  /**
   * 更新个人资料
   */
  updateProfile(params: Record<string, any>): Promise<ApiResponse<null>> {
    return http.put('/auth/update-profile', params)
  },

  /**
   * 修改密码
   */
  changePassword(params: { oldPassword: string; newPassword: string }): Promise<ApiResponse<null>> {
    return http.put('/auth/change-password', params)
  }
}
