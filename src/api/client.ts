/**
 * HTTP 客户端
 * 整合了 Token 管理、Loading 管理、错误处理
 */

import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import type {
  CustomRequestConfig,
  CustomInternalRequestConfig,
  ApiResponse
} from '@/utils/http/types'
import { BusinessCode } from '@/utils/http/types'
import { tokenManager } from '@/utils/http/tokenManager'
import { LoadingManager } from '@/utils/http/loadingManager'
import { ErrorHandler } from '@/utils/http/errorHandler'
import { logger } from '@/utils/logger'
import { apiConfig } from '@/config'

/**
 * HTTP 客户端类
 */
export class HttpClient {
  private instance: AxiosInstance
  private tokenManager: typeof tokenManager
  private loadingManager: LoadingManager
  private errorHandler: ErrorHandler

  constructor(config?: CustomRequestConfig) {
    // 使用全局单例实例（避免循环依赖）
    this.tokenManager = tokenManager
    this.loadingManager = new LoadingManager()
    this.errorHandler = new ErrorHandler()

    // 创建 axios 实例（使用配置管理层的配置）
    this.instance = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: apiConfig.headers,
      withCredentials: apiConfig.withCredentials,
      ...config
    })

    // 设置拦截器
    this.setupRequestInterceptors()
    this.setupResponseInterceptors()
  }

  // --------------------------------------------------------------------------
  // 2. 请求拦截器：发送请求前做什么
  // --------------------------------------------------------------------------

  /**
   * 设置请求拦截器
   * 
   * 请求拦截器的作用：
   * 1. 添加 Token
   * 2. 显示 Loading
   * 3. 添加请求 ID（用于追踪）
   * 4. 添加时间戳（防止缓存）
   * 5. 记录请求开始时间
   */
  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        const customConfig = config as CustomInternalRequestConfig

        logger.log('=====================================')
        logger.log('📤 发送请求:', config.method?.toUpperCase(), config.url)

        // ========================================
        // ① 记录请求开始时间（用于计算耗时）
        // ========================================
        customConfig.metadata = {
          startTime: Date.now(),
          retryCount: 0,
        };

        // ========================================
        // ② 显示 Loading
        // ========================================
        // 默认显示 Loading，除非明确设置 showLoading: false
        if (customConfig.showLoading !== false) {
          this.loadingManager.show();
          logger.log('🔄 显示 Loading');
        }

        // ========================================
        // ③ 添加 Token
        // ========================================
        // 默认添加 Token，除非明确设置 needToken: false
        if (customConfig.needToken !== false) {
          const token = this.tokenManager.getToken();

          if (token) {
            customConfig.headers.Authorization = `Bearer ${token}`;
            logger.log('✅ 已添加 Token');
          } else {
            logger.warn('⚠️  没有 Token（可能未登录）');
          }
        }

        // ========================================
        // ④ 添加请求 ID（用于链路追踪）
        // ========================================
        // 请求 ID 格式：时间戳-随机字符串
        // 示例：1701234567890-abc123
        const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        customConfig.headers['X-Request-Id'] = requestId;
        logger.log('🔖 请求 ID:', requestId);

        // ========================================
        // ⑤ 添加时间戳（防止 GET 请求缓存）
        // ========================================
        // 有些浏览器会缓存 GET 请求，添加时间戳可以避免缓存
        if (customConfig.method?.toLowerCase() === 'get') {
          customConfig.params = {
            ...customConfig.params,
            _t: Date.now(),
          };
        }

        logger.log('📋 请求参数:', customConfig.params)
        logger.log('📦 请求数据:', customConfig.data)
        logger.log('=====================================')

        return customConfig
      },
      (error) => {
        logger.error('❌ 请求拦截器错误:', error)
        this.loadingManager.hide()
        return Promise.reject(error)
      }
    )
  }

  // --------------------------------------------------------------------------
  // 3. 响应拦截器：收到响应后做什么
  // --------------------------------------------------------------------------

  /**
   * 设置响应拦截器
   * 
   * 响应拦截器的作用：
   * 1. 隐藏 Loading
   * 2. 记录响应耗时
   * 3. 处理特殊响应类型（文件下载等）
   * 4. 检查业务状态码
   * 5. Token 过期自动刷新
   * 6. 统一错误处理
   */
  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      // ========================================
      // 响应成功的处理
      // ========================================
      (response: AxiosResponse) => {
        const customConfig = response.config as CustomInternalRequestConfig

        logger.log('=====================================')
        logger.log('📥 收到响应:', response.config.method?.toUpperCase(), response.config.url)

        // ========================================
        // ① 隐藏 Loading
        // ========================================
        if (customConfig.showLoading !== false) {
          this.loadingManager.hide()
          logger.log('✅ 隐藏 Loading')
        }

        // ========================================
        // ② 记录响应耗时
        // ========================================
        const duration = Date.now() - (customConfig.metadata?.startTime || 0)
        logger.log(`⏱️  响应耗时: ${duration}ms`)

        // ========================================
        // ③ 如果需要原始响应，直接返回
        // ========================================
        // 使用场景：需要获取响应头、状态码等信息
        if (customConfig.rawResponse) {
          logger.log('📦 返回原始响应')
          logger.log('=====================================')
          return response
        }

        // ========================================
        // ④ 处理特殊响应类型（文件下载等）
        // ========================================
        // 如果是下载文件，直接返回响应
        if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
          logger.log('📁 文件下载响应')
          logger.log('=====================================')
          return response
        }

        // ========================================
        // ⑤ 解构响应数据
        // ========================================
        const apiResponse = response.data as ApiResponse
        logger.log('📊 响应数据:', apiResponse)

        // ========================================
        // ⑥ 兼容不规范的响应（重点！）
        // ========================================
        // 有些接口可能不返回标准格式，比如健康检查接口
        // 示例：{ message: "服务器运行中" }
        if (apiResponse.code === undefined) {
          logger.warn('⚠️  非标准响应格式')

          if (response.status >= 200 && response.status < 300) {
            logger.log('✅ HTTP 状态码正常，返回原始数据')
            logger.log('=====================================')
            return response.data
          } else {
            logger.error('❌ HTTP 状态码异常')
            logger.log('=====================================')
            throw new Error('服务器响应格式不正确')
          }
        }


        // ========================================
        // ⑦ 业务成功
        // ========================================
        if (apiResponse.code === BusinessCode.SUCCESS) {
          logger.log('✅ 业务成功')
          logger.log('📦 返回数据:', apiResponse.data)
          logger.log('=====================================')
          return apiResponse.data
        }

      },


      // ========================================
      // 响应错误的处理
      // ========================================
      async (error: AxiosError<ApiResponse>) => {
        const customConfig = error.config as CustomInternalRequestConfig | undefined
        logger.log('=====================================')
        logger.error('❌ 响应错误:', error)

        // ========================================
        // ① 隐藏 Loading
        // ========================================
        if (customConfig?.showLoading !== false) {
          this.loadingManager.hide()
        }

        // ========================================
        // ② 请求被取消
        // ========================================
        if (axios.isCancel(error)) {
          logger.warn('⚠️  请求已取消:', error.message)
          logger.log('=====================================')
          return Promise.reject(error)
        }

        // ========================================
        // ③ 网络错误（没有响应）
        // ========================================
        if (!error.response) {
          logger.error('🌐 网络错误: 无法连接到服务器')
          this.showError('网络连接失败，请检查网络设置')
          logger.log('=====================================')
          return Promise.reject(error)
        }

        // ========================================
        // ⑧ Token未提供 ，让用户登录
        // ========================================
        if (error.response.data.code === BusinessCode.NO_TOKEN) {
          logger.warn('⚠️  没有Token，先登录')
          logger.log('=====================================')
          const errorHandler = new ErrorHandler()
          errorHandler.redirectToLoginWithCountdown(5)
          throw new Error('请进行登录')
        }

        // ========================================
        // ⑧ Token 过期，尝试刷新
        // ========================================
        if (error.response.data.code === BusinessCode.TOKEN_EXPIRED) {
          logger.warn('⚠️  Token 过期，尝试刷新...')
          logger.log('=====================================')
          return this.handleTokenExpired(error.config)
        }

        // ========================================
        // ⑨ Token 无效，跳转登录
        // ========================================
        if (error.response.data.code === BusinessCode.TOKEN_INVALID) {
          logger.error('❌ Token 无效')
          this.handleUnauthorized()
          logger.log('=====================================')
          throw new Error('登录已过期，请重新登录')
        }


        // ========================================
        // ⑩ 权限不足
        // ========================================
        if (error.response.data.code === BusinessCode.PERMISSION_DENIED) {
          logger.error('❌ 权限不足')
          if (customConfig?.showError !== false) {
            this.showError('权限不足，无法访问该资源')
          }
          logger.log('=====================================')
          throw new Error(error.response.data.message)
        }

        // ========================================
        // ⑪ 其他业务错误
        // ========================================
        // logger.error('❌ 业务失败')
        // logger.error('错误码:', error.response.data.code)
        // logger.error('错误信息:', error.response.data.message)
        // logger.error('链路追踪 ID:', error.response.data.traceId)




        // ========================================
        // ④ HTTP 状态码错误
        // ========================================
        const status = error.response.status
        const duration = Date.now() - (customConfig?.metadata?.startTime || 0)

        logger.error(`HTTP 状态码: ${status}`)
        logger.log(`耗时: ${duration}ms`)

        // 使用错误处理器处理
        this.errorHandler.handle(error)


        logger.log('=====================================')
        return Promise.reject(error.response.data)
      }
    )
  }

  // --------------------------------------------------------------------------
  // 4. 辅助方法
  // --------------------------------------------------------------------------

  /**
   * 处理 Token 过期
   */
  private async handleTokenExpired(config: any): Promise<any> {
    try {
      // 刷新 Token
      const newToken = await this.tokenManager.refreshToken()

      // 用新 Token 重新发起请求
      const newConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${newToken}`
        }
      }

      return this.instance.request(newConfig)
    } catch (error) {
      const errorHandler = new ErrorHandler()
      errorHandler.redirectToLoginWithCountdown(5) // 5 秒后跳转
      return Promise.reject('登录已过期，请重新登录')
    }
  }

  /**
   * 处理未授权（跳转登录）
   */
  private handleUnauthorized(): void {
    this.tokenManager.clearTokens()
    this.loadingManager.clear()

    const loginUrl = '/login'

    const currentPath = window.location.pathname

    if (currentPath !== loginUrl) {
      window.location.href = `${loginUrl}?redirect=${encodeURIComponent(currentPath)}`
    }
  }

  /**
   * 显示错误提示
   */
  private showError(message: string): void {
    // TODO: 接入 Element Plus 消息提示
    logger.error('❌', message)
  }


  // --------------------------------------------------------------------------
  // 5. 公开的请求方法
  // --------------------------------------------------------------------------


  /**
   * GET 请求
   */
  get<T = any>(url: string, config?: CustomRequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  /**
   * POST 请求
   */
  post<T = any>(url: string, data?: any, config?: CustomRequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: CustomRequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, config?: CustomRequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }

  /**
   * PATCH 请求
   */
  patch<T = any>(url: string, data?: any, config?: CustomRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config)
  }
}

/**
 * 导出全局 HTTP 客户端实例
 */
export const httpClient = new HttpClient()

/**
 * 便捷的请求方法（可直接使用）
 */
export const request = {
  get: <T = any>(url: string, config?: CustomRequestConfig) => httpClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: CustomRequestConfig) => httpClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: CustomRequestConfig) => httpClient.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: CustomRequestConfig) => httpClient.delete<T>(url, config),
  patch: <T = any>(url: string, data?: any, config?: CustomRequestConfig) => httpClient.patch<T>(url, data, config)
}
