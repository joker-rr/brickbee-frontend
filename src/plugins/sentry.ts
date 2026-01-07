/**
 * Sentry 错误监控插件
 *
 * 用于生产环境的错误追踪和性能监控
 * 注意：需要安装 @sentry/vue 依赖才能使用
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import { logger } from '../utils/logger'
/**
 * Sentry 配置选项
 */
export interface SentryOptions {
  /** Sentry DSN */
  dsn: string
  /** 环境名称 */
  environment?: string
  /** 发布版本 */
  release?: string
  /** 性能采样率 (0-1) */
  tracesSampleRate?: number
  /** 会话回放采样率 (0-1) */
  replaysSessionSampleRate?: number
  /** 错误时会话回放采样率 (0-1) */
  replaysOnErrorSampleRate?: number
  /** 是否启用 */
  enabled?: boolean
}

/**
 * Sentry 模块类型
 */
interface SentryModule {
  init: (options: Record<string, unknown>) => void
  captureException: (error: unknown, context?: Record<string, unknown>) => void
  captureMessage: (message: string, level?: string) => void
  setUser: (user: Record<string, unknown> | null) => void
  setTag: (key: string, value: string) => void
  setExtra: (key: string, value: unknown) => void
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void
  browserTracingIntegration: (options: Record<string, unknown>) => unknown
  replayIntegration: (options: Record<string, unknown>) => unknown
}

/**
 * Sentry 实例（延迟加载）
 */
let sentryInstance: SentryModule | null = null

/**
 * 初始化 Sentry
 *
 * @param app Vue 应用实例
 * @param router Vue Router 实例
 * @param options Sentry 配置
 */
export async function setupSentry(
  app: App,
  router: Router,
  options: SentryOptions
): Promise<void> {
  const {
    dsn,
    environment = 'production',
    release,
    tracesSampleRate = 0.1,
    replaysSessionSampleRate = 0.1,
    replaysOnErrorSampleRate = 1.0,
    enabled = true
  } = options

  // 非生产环境或未启用时跳过
  if (!enabled || !dsn) {
    logger.log('[Sentry] Disabled - skipping initialization')
    return
  }

  try {
    // 动态导入 Sentry（减少初始包大小）
    // @ts-ignore - @sentry/vue 是可选依赖，运行时才会检查是否存在
    const Sentry = (await import('@sentry/vue')) as unknown as SentryModule
    sentryInstance = Sentry

    Sentry.init({
      app,
      dsn,
      environment,
      release,

      // 集成配置
      integrations: [
        // 路由追踪
        Sentry.browserTracingIntegration({
          router
        }),
        // 会话回放
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false
        })
      ],

      // 性能监控采样率
      tracesSampleRate,

      // 会话回放采样率
      replaysSessionSampleRate,
      replaysOnErrorSampleRate,

      // 过滤敏感信息
      beforeSend(event: Record<string, unknown>) {
        const request = event.request as Record<string, unknown> | undefined
        // 移除敏感 header
        if (request?.headers) {
          const headers = request.headers as Record<string, unknown>
          delete headers['Authorization']
          delete headers['Cookie']
          delete headers['X-Auth-Token']
        }

        // 移除敏感 URL 参数
        if (request?.url && typeof request.url === 'string') {
          try {
            const url = new URL(request.url)
            url.searchParams.delete('token')
            url.searchParams.delete('password')
            url.searchParams.delete('apiKey')
            request.url = url.toString()
          } catch {
            // URL 解析失败，保持原样
          }
        }

        return event
      },

      // 忽略某些错误
      ignoreErrors: [
        // 网络错误
        'Network Error',
        'Failed to fetch',
        'NetworkError',
        // 用户取消
        'AbortError',
        'Request aborted',
        // 浏览器扩展
        /^chrome-extension/,
        /^moz-extension/,
        // ResizeObserver
        'ResizeObserver loop'
      ],

      // 忽略某些 URL
      denyUrls: [
        // Chrome 扩展
        /extensions\//i,
        /^chrome:\/\//i,
        // Firefox 扩展
        /^moz-extension:\/\//i
      ]
    })

    logger.log('[Sentry] Initialized successfully')
  } catch (error) {
    logger.error('[Sentry] Failed to initialize:', error)
  }
}

/**
 * 手动捕获异常
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (sentryInstance) {
    sentryInstance.captureException(error, {
      extra: context
    })
  } else {
    logger.error('[Sentry] Not initialized, logging error:', error)
  }
}

/**
 * 手动捕获消息
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (sentryInstance) {
    sentryInstance.captureMessage(message, level)
  } else {
    logger.log(`[Sentry] ${level}: ${message}`)
  }
}

/**
 * 设置用户上下文
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (sentryInstance) {
    sentryInstance.setUser(user)
  }
}

/**
 * 设置标签
 */
export function setTag(key: string, value: string): void {
  if (sentryInstance) {
    sentryInstance.setTag(key, value)
  }
}

/**
 * 设置额外上下文
 */
export function setExtra(key: string, value: unknown): void {
  if (sentryInstance) {
    sentryInstance.setExtra(key, value)
  }
}

/**
 * 添加面包屑（用于追踪用户操作）
 */
export function addBreadcrumb(breadcrumb: {
  category?: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}): void {
  if (sentryInstance) {
    sentryInstance.addBreadcrumb(breadcrumb)
  }
}
