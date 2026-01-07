/**
 * 执行会话管理 Composable
 *
 * @deprecated 业务模块应直接使用 executionSessionManager
 * 此 composable 仅作为 Vue 组件的便捷封装
 *
 * 迁移指南：
 * - 创建会话: executionSessionManager.createSession(platform, apiKey)
 * - 获取 Token: executionSessionManager.getValidToken(platform)
 * - 销毁会话: executionSessionManager.destroySession(platform)
 */

import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { PlatformType } from '@/config/platform.config'
import {
  executionSessionManager,
  platformKeyManager,
  type ExecutionSession as ManagerSession
} from '@/composables/platform-access'
import type { ApiKeyStorageMode, ExecutionSession } from '@/types/execution'
import { logger } from '@/utils/logger'
import { toast } from '@/utils/toast'

/**
 * 将 manager session 转换为 store 期望的完整 ExecutionSession
 */
function toStoreSession(
  session: ManagerSession,
  storageMode: ApiKeyStorageMode
): ExecutionSession {
  // SessionStatus: 'idle' | 'active' | 'expired' | 'error'
  // ExecutionSessionStatus: 'idle' | 'created' | 'active' | 'expired' | 'error'
  // 直接映射即可，类型是兼容的
  return {
    executionToken: session.executionToken,
    sessionId: `session_${session.platform}_${session.createdAt}`,
    expiresAt: session.expiresAt,
    refreshWindow: session.refreshWindow,
    status: session.status as ExecutionSession['status'],
    platform: session.platform,
    storageMode,
    createdAt: session.createdAt,
    lastActivityAt: session.lastRefreshedAt,
    requestCount: session.requestCount
  }
}

/**
 * 执行会话管理 Composable（Vue 封装）
 *
 * @deprecated 业务模块应直接使用 executionSessionManager
 */
export function useExecutionSession() {
  /** 当前平台 */
  const currentPlatform = ref<PlatformType | null>(null)

  /** 当前会话（从 manager 获取） */
  const managerSession = ref<ManagerSession | null>(null)

  /** 当前存储模式 */
  const currentStorageMode = ref<ApiKeyStorageMode>('local')

  /** 是否正在处理 */
  const isProcessing = ref(false)

  /** 错误信息 */
  const error = ref<string | null>(null)

  /** 取消订阅函数 */
  let unsubscribe: (() => void) | null = null

  /**
   * 转换后的会话（兼容 store 期望的类型）
   */
  const session = computed<ExecutionSession | null>(() => {
    if (!managerSession.value) return null
    return toStoreSession(managerSession.value, currentStorageMode.value)
  })

  // ============================================================================
  // 计算属性
  // ============================================================================

  const isActive = computed(() => session.value?.status === 'active')
  const isExpired = computed(() => session.value?.status === 'expired')
  const executionToken = computed(() => session.value?.executionToken || null)

  const timeToExpiry = computed(() => {
    if (!session.value) return 0
    return Math.max(0, session.value.expiresAt - Date.now())
  })

  const shouldRefresh = computed(() => {
    if (!session.value) return false
    const now = Date.now()
    return now >= session.value.expiresAt - session.value.refreshWindow
  })

  // ============================================================================
  // 会话管理方法（委托给 executionSessionManager）
  // ============================================================================

  /**
   * 创建执行会话
   *
   * @deprecated 请直接使用 executionSessionManager.createSession()
   */
  async function createSession(params: {
    platform: PlatformType
    storageMode: ApiKeyStorageMode
    password?: string
    apiKey?: string
  }): Promise<boolean> {
    const { platform, storageMode, password, apiKey } = params

    isProcessing.value = true
    error.value = null
    currentPlatform.value = platform
    currentStorageMode.value = storageMode

    try {
      let plainKey: string | null = null

      if (storageMode === 'local') {
        if (apiKey) {
          // 直接使用传入的 Key
          plainKey = apiKey
        } else if (password) {
          // 从平台访问层解密
          plainKey = await platformKeyManager.unlockLocalKey(platform, password)
        }

        if (!plainKey) {
          error.value = '无法获取 API Key，请检查密码是否正确'
          return false
        }
      }

      // 委托给 executionSessionManager 创建会话
      await executionSessionManager.createSession(platform, plainKey!)

      // 订阅会话变化
      subscribeToSession(platform)

      // 更新本地状态
      managerSession.value = executionSessionManager.getSession(platform)

      logger.log(`[useExecutionSession] 会话创建成功: ${platform}`)
      toast.success('执行会话已激活')

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建会话失败'
      error.value = message
      logger.error('[useExecutionSession] 创建会话失败:', err)
      toast.error(message)
      return false
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 刷新执行会话
   *
   * @deprecated 请直接使用 executionSessionManager.refreshSession()
   */
  async function refreshSession(): Promise<boolean> {
    if (!currentPlatform.value) {
      error.value = '没有活跃的平台'
      return false
    }

    isProcessing.value = true
    error.value = null

    try {
      await executionSessionManager.refreshSession(currentPlatform.value)
      managerSession.value = executionSessionManager.getSession(currentPlatform.value)

      logger.log('[useExecutionSession] 会话刷新成功')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '刷新会话失败'
      error.value = message
      logger.error('[useExecutionSession] 刷新会话失败:', err)
      toast.error('执行会话已过期，请重新解锁')
      return false
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 销毁执行会话
   *
   * @deprecated 请直接使用 executionSessionManager.destroySession()
   */
  async function destroySession(): Promise<boolean> {
    if (!currentPlatform.value) {
      return true
    }

    isProcessing.value = true
    error.value = null

    try {
      await executionSessionManager.destroySession(currentPlatform.value)
      managerSession.value = null
      currentPlatform.value = null

      // 取消订阅
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }

      logger.log('[useExecutionSession] 会话已销毁')
      toast.success('执行会话已关闭')
      return true
    } catch (err) {
      // 即使失败也清理本地状态
      managerSession.value = null

      const message = err instanceof Error ? err.message : '销毁会话失败'
      logger.warn('[useExecutionSession] 销毁会话请求失败，已清理本地状态:', message)
      return true
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 检查并刷新（每次请求前调用）
   *
   * @deprecated 请直接使用 executionSessionManager.getValidToken()
   */
  async function checkAndRefresh(): Promise<boolean> {
    if (!currentPlatform.value || !session.value) {
      return false
    }

    try {
      // getValidToken 会自动处理刷新
      await executionSessionManager.getValidToken(currentPlatform.value)
      managerSession.value = executionSessionManager.getSession(currentPlatform.value)
      return true
    } catch {
      return false
    }
  }

  /**
   * 更新请求计数
   *
   * @deprecated 请直接使用 executionSessionManager.recordRequest()
   */
  function incrementRequestCount(): void {
    if (currentPlatform.value) {
      executionSessionManager.recordRequest(currentPlatform.value, true, 0)
      managerSession.value = executionSessionManager.getSession(currentPlatform.value)
    }
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 订阅会话变化
   */
  function subscribeToSession(platform: PlatformType): void {
    // 先取消之前的订阅
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = executionSessionManager.subscribe((changedPlatform, changedSession) => {
      if (changedPlatform === platform) {
        managerSession.value = changedSession
      }
    })
  }

  // ============================================================================
  // 生命周期
  // ============================================================================

  // 组件卸载时取消订阅
  onBeforeUnmount(() => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  // 监听会话状态变化
  watch(
    () => session.value?.status,
    (newStatus) => {
      if (newStatus === 'expired') {
        toast.warning('执行会话已过期')
      }
    }
  )

  return {
    // 状态
    session: computed(() => session.value),
    isActive,
    isExpired,
    isProcessing: computed(() => isProcessing.value),
    error: computed(() => error.value),
    executionToken,
    timeToExpiry,
    shouldRefresh,

    // 方法（委托给 executionSessionManager）
    createSession,
    refreshSession,
    destroySession,
    checkAndRefresh,
    incrementRequestCount
  }
}