import axios from 'axios'
import type { ApiResponse } from '@/types'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 不需要认证的接口列表
const PUBLIC_APIS = ['/auth/login', '/auth/register']

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const url = config.url || ''
    
    // 登录/注册接口不携带token（避免残留token导致问题）
    const isPublicApi = PUBLIC_APIS.some(api => url.includes(api))
    
    if (userStore.token && !isPublicApi) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    console.log(`[REQUEST] ${config.method?.toUpperCase()} ${url} | Auth: ${config.headers.Authorization ? 'Yes' : 'No'}`)
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    
    // 业务错误处理
    if (res.code !== 200) {
      // 未授权
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push({ name: 'Login' })
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return response
  },
  (error) => {
    // 网络错误处理
    let message = '网络错误，请检查网络连接'
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请重新登录'
          const userStore = useUserStore()
          userStore.logout()
          router.push({ name: 'Login' })
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = error.response.data?.message || '请求失败'
      }
    }
    
    return Promise.reject(new Error(message))
  }
)

export default request

// 封装请求方法
export const http = {
  get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    return request.get(url, { params }).then(res => res.data)
  },
  
  post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return request.post(url, data).then(res => res.data)
  },
  
  put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return request.put(url, data).then(res => res.data)
  },
  
  delete<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    return request.delete(url, { params }).then(res => res.data)
  }
}
