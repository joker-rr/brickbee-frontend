import { env } from './env.config'

/**
 * API 配置
 */
export const apiConfig = {
  /** API 基础 URL */
  baseURL: env.VITE_API_BASE_URL,

  /** 请求超时时间（毫秒） */
  timeout: env.VITE_API_TIMEOUT,

  /** 是否携带凭证 */
  withCredentials: true,

  /** 重试配置 */
  retry: {
    /** 最大重试次数 */
    maxRetries: 3,
    /** 初始延迟（毫秒） */
    initialDelay: 1000,
    /** 最大延迟（毫秒） */
    maxDelay: 10000,
    /** 是否使用指数退避 */
    exponentialBackoff: true
  },

  /** 请求头配置 */
  headers: {
    'Content-Type': 'application/json'
  }
}
