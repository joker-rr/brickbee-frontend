/**
 * 执行会话状态管理 Store
 *
 * 管理执行会话、脚本运行状态、请求统计
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { PlatformType } from '@/config/platform.config'
import type {
  ExecutionSession,
  ExecutionSessionStatus,
  ApiKeyStorageMode
} from '@/api/modules/platform/execution/types'
import type {
  ScriptStatus,
  ScriptConfig,
  RequestStats,
  ScriptLog
} from '@/types/market-automation'
import { logger } from '@/utils/logger'

/**
 * 默认脚本配置
 */
const DEFAULT_SCRIPT_CONFIG: ScriptConfig = {
  interval: 300,
  maxRetries: 3,
  timeout: 5000,
  autoAdjustPrice: false
}

/**
 * 默认请求统计
 */
const DEFAULT_STATS: RequestStats = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  avgResponseTime: 0,
  lastRequestAt: 0
}

/**
 * 执行会话 Store
 */
export const useExecutionStore = defineStore('execution', () => {
  // ========================
  // State
  // ========================

  /** 当前执行会话 */
  const currentSession = ref<ExecutionSession | null>(null)

  /** API Key 存储模式 */
  const storageMode = ref<ApiKeyStorageMode>('local')

  /** 脚本运行状态 */
  const scriptStatus = ref<ScriptStatus>('idle')

  /** 脚本配置 */
  const scriptConfig = ref<ScriptConfig>({ ...DEFAULT_SCRIPT_CONFIG })

  /** 请求统计 */
  const stats = ref<RequestStats>({ ...DEFAULT_STATS })

  /** 运行日志 */
  const logs = ref<ScriptLog[]>([])

  /** 最大日志数量 */
  const maxLogs = 200

  /** 是否正在处理 */
  const isProcessing = ref(false)

  /** 错误信息 */
  const error = ref<string | null>(null)

  // ========================
  // Getters
  // ========================

  /** 会话是否活跃 */
  const isSessionActive = computed(() => currentSession.value?.status === 'active')

  /** 会话是否过期 */
  const isSessionExpired = computed(() => currentSession.value?.status === 'expired')

  /** 脚本是否运行中 */
  const isScriptRunning = computed(() => scriptStatus.value === 'running')

  /** 脚本是否暂停 */
  const isScriptPaused = computed(() => scriptStatus.value === 'paused')

  /** 执行 Token */
  const executionToken = computed(() => currentSession.value?.executionToken || null)

  /** 会话剩余时间 (ms) */
  const sessionTimeRemaining = computed(() => {
    if (!currentSession.value) return 0
    return Math.max(0, currentSession.value.expiresAt - Date.now())
  })

  /** 成功率 */
  const successRate = computed(() => {
    if (stats.value.totalRequests === 0) return 0
    return Math.round((stats.value.successRequests / stats.value.totalRequests) * 100)
  })

  /** 当前平台 */
  const currentPlatform = computed(() => currentSession.value?.platform || null)

  // ========================
  // Actions
  // ========================

  /**
   * 设置当前会话
   */
  function setSession(session: ExecutionSession | null): void {
    currentSession.value = session
    if (session) {
      storageMode.value = session.storageMode
      logger.log(`[ExecutionStore] 会话已设置: ${session.platform}`)
    } else {
      logger.log('[ExecutionStore] 会话已清除')
    }
  }

  /**
   * 更新会话状态
   */
  function updateSessionStatus(status: ExecutionSessionStatus): void {
    if (currentSession.value) {
      currentSession.value = {
        ...currentSession.value,
        status
      }
    }
  }

  /**
   * 更新会话 Token
   */
  function updateSessionToken(token: string, expiresAt: number): void {
    if (currentSession.value) {
      currentSession.value = {
        ...currentSession.value,
        executionToken: token,
        expiresAt,
        lastActivityAt: Date.now()
      }
    }
  }

  /**
   * 增加请求计数
   */
  function incrementRequestCount(): void {
    if (currentSession.value) {
      currentSession.value = {
        ...currentSession.value,
        requestCount: currentSession.value.requestCount + 1,
        lastActivityAt: Date.now()
      }
    }
  }

  /**
   * 设置脚本状态
   */
  function setScriptStatus(status: ScriptStatus): void {
    const oldStatus = scriptStatus.value
    scriptStatus.value = status
    logger.log(`[ExecutionStore] 脚本状态: ${oldStatus} -> ${status}`)
  }

  /**
   * 更新脚本配置
   */
  function updateScriptConfig(config: Partial<ScriptConfig>): void {
    // 验证间隔
    if (config.interval !== undefined && config.interval < 300) {
      config.interval = 300
      logger.warn('[ExecutionStore] 执行间隔已调整为最小值 300ms')
    }

    scriptConfig.value = {
      ...scriptConfig.value,
      ...config
    }
  }

  /**
   * 更新请求统计
   */
  function updateStats(success: boolean, responseTime: number): void {
    stats.value.totalRequests++
    stats.value.lastRequestAt = Date.now()

    if (success) {
      stats.value.successRequests++
    } else {
      stats.value.failedRequests++
    }

    // 更新平均响应时间（简化计算）
    const total = stats.value.totalRequests
    stats.value.avgResponseTime = Math.round(
      (stats.value.avgResponseTime * (total - 1) + responseTime) / total
    )
  }

  /**
   * 重置请求统计
   */
  function resetStats(): void {
    stats.value = { ...DEFAULT_STATS }
  }

  /**
   * 添加日志
   */
  function addLog(log: ScriptLog): void {
    logs.value.unshift(log)

    // 限制日志数量
    if (logs.value.length > maxLogs) {
      logs.value.pop()
    }
  }

  /**
   * 清除日志
   */
  function clearLogs(): void {
    logs.value = []
  }

  /**
   * 设置存储模式
   */
  function setStorageMode(mode: ApiKeyStorageMode): void {
    storageMode.value = mode
  }

  /**
   * 设置处理状态
   */
  function setProcessing(processing: boolean): void {
    isProcessing.value = processing
  }

  /**
   * 设置错误
   */
  function setError(errorMessage: string | null): void {
    error.value = errorMessage
  }

  /**
   * 清理会话（退出或过期时调用）
   */
  function clearSession(): void {
    currentSession.value = null
    scriptStatus.value = 'idle'
    error.value = null
    logger.log('[ExecutionStore] 会话已清理')
  }

  /**
   * 重置 Store
   */
  function reset(): void {
    currentSession.value = null
    storageMode.value = 'local'
    scriptStatus.value = 'idle'
    scriptConfig.value = { ...DEFAULT_SCRIPT_CONFIG }
    stats.value = { ...DEFAULT_STATS }
    logs.value = []
    isProcessing.value = false
    error.value = null
    logger.log('[ExecutionStore] Store 已重置')
  }

  // ========================
  // Watchers
  // ========================

  // 监听会话状态变化
  watch(
    () => currentSession.value?.status,
    (status) => {
      if (status === 'expired' || status === 'error') {
        // 会话失效时停止脚本
        if (scriptStatus.value === 'running') {
          scriptStatus.value = 'stopped'
          logger.warn('[ExecutionStore] 会话失效，脚本已停止')
        }
      }
    }
  )

  return {
    // State
    currentSession,
    storageMode,
    scriptStatus,
    scriptConfig,
    stats,
    logs,
    isProcessing,
    error,

    // Getters
    isSessionActive,
    isSessionExpired,
    isScriptRunning,
    isScriptPaused,
    executionToken,
    sessionTimeRemaining,
    successRate,
    currentPlatform,

    // Actions
    setSession,
    updateSessionStatus,
    updateSessionToken,
    incrementRequestCount,
    setScriptStatus,
    updateScriptConfig,
    updateStats,
    resetStats,
    addLog,
    clearLogs,
    setStorageMode,
    setProcessing,
    setError,
    clearSession,
    reset
  }
})
