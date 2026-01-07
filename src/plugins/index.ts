/**
 * 插件统一注册入口
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import { setupSentry, type SentryOptions } from './sentry'
import { logger } from '../utils/logger'
// 导出所有插件
export * from './sentry'

/**
 * 插件注册配置
 */
export interface PluginsOptions {
  /** Sentry 配置 */
  sentry?: SentryOptions | false
}

/**
 * 注册所有插件
 *
 * @param app Vue 应用实例
 * @param router Vue Router 实例
 * @param options 插件配置
 */
export async function setupPlugins(
  app: App,
  router: Router,
  options: PluginsOptions = {}
): Promise<void> {
  const { sentry } = options

  // Sentry 错误监控
  if (sentry !== false && sentry?.dsn) {
    await setupSentry(app, router, sentry)
  }

  // TODO: 添加更多插件
  // - LogRocket 用户行为录制
  // - Google Analytics
  // - etc.

  logger.log('[Plugins] All plugins registered')
}

/**
 * 从环境变量获取默认插件配置
 */
export function getDefaultPluginsOptions(): PluginsOptions {
  const env = import.meta.env

  return {
    sentry: env.VITE_SENTRY_DSN
      ? {
        dsn: env.VITE_SENTRY_DSN,
        environment: env.VITE_APP_ENV || 'development',
        enabled: env.VITE_APP_ENV === 'production',
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0
      }
      : false
  }
}
