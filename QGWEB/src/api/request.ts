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

// ==================== 请求缓存 ====================
// 对 GET 请求做短时缓存，避免页面切换时重复请求相同数据
const CACHE_TTL = 30_000 // 30 秒
const cache = new Map<string, { data: unknown; expireAt: number }>()

function getCacheKey(config: { url?: string; params?: Record<string, unknown> }): string {
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${config.url}?${params}`
}

function getCached(key: string): unknown | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expireAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expireAt: Date.now() + CACHE_TTL })
  // 防止内存泄漏：超过 50 条时清理过期项
  if (cache.size > 50) {
    const now = Date.now()
    for (const [k, v] of cache) {
      if (now > v.expireAt) cache.delete(k)
    }
  }
}

/** 清除所有缓存（登录/退出/数据变更后调用） */
export function clearCache(): void {
  cache.clear()
}

// ==================== 请求去重 ====================
// 同一 GET 请求在途时复用同一个 Promise，避免重复发送
const pending = new Map<string, Promise<unknown>>()

// ==================== 不需要认证的接口列表 ====================
const PUBLIC_APIS = ['/auth/login', '/auth/register']

// ==================== 请求拦截器 ====================
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const url = config.url || ''

    // 登录/注册接口不携带token
    const isPublicApi = PUBLIC_APIS.some(api => url === api || url.endsWith(api))

    if (userStore.token && !isPublicApi) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    if (import.meta.env.DEV) {
      console.log(`[REQUEST] ${config.method?.toUpperCase()} ${url} | Auth: ${config.headers.Authorization ? 'Yes' : 'No'}`)
    }

    // GET 请求：检查缓存
    if (config.method?.toLowerCase() === 'get') {
      const key = getCacheKey(config)
      const cached = getCached(key)
      if (cached !== null) {
        // 使用 adapter 短路请求，直接返回缓存数据
        config.adapter = () => {
          return Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          })
        }
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ==================== 响应拦截器 ====================
request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    const config = response.config

    // 缓存 GET 请求的响应
    if (config.method?.toLowerCase() === 'get' && res.code === 200) {
      const key = getCacheKey(config)
      setCache(key, res)
      // 清理去重记录
      pending.delete(key)
    }

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
    // 清理去重记录（出错的请求）
    if (error.config?.method?.toLowerCase() === 'get') {
      const key = getCacheKey(error.config)
      pending.delete(key)
    }

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

// ==================== 封装请求方法 ====================
// GET 请求支持去重：同一 URL 在途时复用 Promise
export const http = {
  get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const key = `${url}?${JSON.stringify(params || {})}`
    const existing = pending.get(key) as Promise<ApiResponse<T>> | undefined
    if (existing) return existing

    const promise = request.get(url, { params }).then(res => res.data)
    pending.set(key, promise)
    // 请求完成后清理（超时兜底：5 秒后强制清理）
    promise.finally(() => { setTimeout(() => pending.delete(key), 5000) })
    return promise
  },

  post<T = unknown>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request.post(url, data).then(res => res.data)
  },

  put<T = unknown>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request.put(url, data).then(res => res.data)
  },

  delete<T = unknown>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request.delete(url, { params }).then(res => res.data)
  }
}
