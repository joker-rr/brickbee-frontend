/**
 * 执行会话管理器（单例）
 *
 * 职责：
 * - 创建、刷新、销毁 execution_session
 * - 管理 execution_token 生命周期
 * - 向业务模块提供"可用 execution_token"
 *
 * 禁止：
 * - 存储 API Key
 * - 直接调用第三方 API
 */

import { PlatformType } from '@/config/platform.config'
import { executionSessionApi } from '@/api/modules/platform/execution/executionSession'
import { securityKeyApi } from '@/api/modules/platform/execution/securityKey'
import { cryptoService } from '@/services/crypto.service'
// ============================================================================
// Types
// ============================================================================

export type SessionStatus = 'idle' | 'active' | 'expired' | 'error'

export interface ExecutionSession {
  platform: PlatformType
  executionToken: string
  expiresAt: number
  refreshWindow: number
  status: SessionStatus
  createdAt: number
  lastRefreshedAt: number
  requestCount: number
}

export interface SessionStats {
  totalRequests: number
  successCount: number
  failureCount: number
  avgResponseTime: number
}

export type SessionChangeCallback = (
  platform: PlatformType,
  session: ExecutionSession | null
) => void

export interface ExecutionSessionManager {
  /**
   * 获取指定平台的当前会话
   */
  getSession(platform: PlatformType): ExecutionSession | null

  /**
   * 获取可用的 execution_token（唯一入口）
   * 如果即将过期会自动刷新
   * 如果不存在会抛出错误
   */
  getValidToken(platform: PlatformType): Promise<string>

  /**
   * 创建执行会话
   * @param apiKey 明文 Key（仅此一次传输）
   */
  createSession(platform: PlatformType, apiKey: string): Promise<void>

  /**
   * 刷新执行会话
   */
  refreshSession(platform: PlatformType): Promise<void>

  /**
   * 销毁执行会话
   */
  destroySession(platform: PlatformType): Promise<void>

  /**
   * 检查会话是否有效
   */
  isSessionValid(platform: PlatformType): boolean

  /**
   * 获取会话统计
   */
  getStats(platform: PlatformType): SessionStats

  /**
   * 记录请求结果（用于统计）
   */
  recordRequest(platform: PlatformType, success: boolean, responseTime: number): void

  /**
   * 订阅会话变化
   */
  subscribe(callback: SessionChangeCallback): () => void
}

// ============================================================================
// Constants
// ============================================================================

/** 会话有效期（1小时） */
const SESSION_TTL = 60 * 60 * 1000

/** 刷新窗口（10分钟） */
const REFRESH_WINDOW = 10 * 60 * 1000

/** 刷新检查间隔（1分钟） */
const REFRESH_CHECK_INTERVAL = 60 * 1000


// ============================================================================
// Implementation
// ============================================================================

class ExecutionSessionManagerImpl implements ExecutionSessionManager {
  private sessions = new Map<PlatformType, ExecutionSession>()
  private stats = new Map<PlatformType, SessionStats>()
  private refreshTimers = new Map<PlatformType, ReturnType<typeof setInterval>>()
  private subscribers = new Set<SessionChangeCallback>()

  constructor() {
    // 启动全局刷新检查
    this.startGlobalRefreshCheck()
  }

  /**
   * 获取指定平台的当前会话
   */
  getSession(platform: PlatformType): ExecutionSession | null {
    const session = this.sessions.get(platform)

    if (!session) {
      return null
    }

    // 检查是否过期
    if (Date.now() >= session.expiresAt) {
      this.updateSessionStatus(platform, 'expired')
      return this.sessions.get(platform)!
    }

    return session
  }

  /**
   * 获取可用的 execution_token（唯一入口）
   */
  async getValidToken(platform: PlatformType): Promise<string> {
    const session = this.sessions.get(platform)

    if (!session) {
      throw new Error(`平台 ${platform} 无执行会话，请先解锁 API Key`)
    }

    if (session.status === 'error') {
      throw new Error(`平台 ${platform} 会话状态异常: ${session.status}`)
    }

    // 检查是否已过期
    const now = Date.now()
    if (now >= session.expiresAt) {
      this.updateSessionStatus(platform, 'expired')
      throw new Error(`平台 ${platform} 会话已过期，请重新解锁 API Key`)
    }

    // 检查是否需要刷新
    if (now >= session.expiresAt - session.refreshWindow) {
      try {
        await this.refreshSession(platform)
      } catch (error) {
        console.warn(`会话刷新失败，使用现有 token:`, error)
        // 刷新失败但 token 尚未过期，继续使用
      }
    }

    return this.sessions.get(platform)!.executionToken
  }

  /**
   * 创建执行会话
   */
  async createSession(platform: PlatformType, apiKey: string): Promise<void> {
    try {


      // 1. 拿公钥
      const { keyId, publicKey } = await securityKeyApi.getPublicKey()

      // 2. 拿 challenge
      const { challengeId } = await securityKeyApi.getChallengeId({
        platform,
      })

      const encryptedKey = await cryptoService.rsaEncrypt(apiKey, publicKey)
      // 调用后端 API 创建会话
      // 注意：API Key 通过 encryptedKey 传输（实际应用中需要加密）
      const response = await executionSessionApi.create({
        platform,
        storageMode: 'local',
        challengeId,
        keyId,
      },
        encryptedKey  // ✅ 直接传
      )

      const now = Date.now()
      const expiresAt = response.expiresAt
        ? new Date(response.expiresAt).getTime()
        : now + SESSION_TTL

      const session: ExecutionSession = {
        platform,
        executionToken: response.executionToken,
        expiresAt,
        refreshWindow: REFRESH_WINDOW,
        status: 'active',
        createdAt: now,
        lastRefreshedAt: now,
        requestCount: 0
      }

      this.sessions.set(platform, session)
      this.initStats(platform)
      this.startRefreshTimer(platform)
      this.notifySubscribers(platform, session)
    } catch (error) {
      // 创建失败，设置错误状态
      const errorSession: ExecutionSession = {
        platform,
        executionToken: '',
        expiresAt: 0,
        refreshWindow: 0,
        status: 'error',
        createdAt: Date.now(),
        lastRefreshedAt: 0,
        requestCount: 0
      }
      this.sessions.set(platform, errorSession)
      this.notifySubscribers(platform, errorSession)
      throw error
    }
  }

  /**
   * 刷新执行会话
   */
  async refreshSession(platform: PlatformType): Promise<void> {
    const session = this.sessions.get(platform)

    if (!session || session.status !== 'active') {
      throw new Error(`平台 ${platform} 无有效会话可刷新`)
    }

    try {
      const response = await executionSessionApi.refresh(session.executionToken)

      const now = Date.now()
      const expiresAt = response.expiresAt
        ? new Date(response.expiresAt).getTime()
        : now + SESSION_TTL

      const updatedSession: ExecutionSession = {
        ...session,
        executionToken: response.executionToken,
        expiresAt,
        lastRefreshedAt: now
      }

      this.sessions.set(platform, updatedSession)
      this.notifySubscribers(platform, updatedSession)
    } catch (error) {
      // 刷新失败，标记会话过期
      this.updateSessionStatus(platform, 'expired')
      throw error
    }
  }

  /**
   * 销毁执行会话
   */
  async destroySession(platform: PlatformType): Promise<void> {
    const session = this.sessions.get(platform)
    if (session && session.executionToken) {
      try {
        await executionSessionApi.destroy(session.executionToken)
      } catch (error) {
        console.warn(`销毁会话 API 调用失败:`, error)
        // 即使 API 调用失败，也清理本地状态
      }
    }


    this.stopRefreshTimer(platform)
    this.sessions.delete(platform)
    this.stats.delete(platform)
    this.notifySubscribers(platform, null)
  }

  /**
   * 检查会话是否有效
   */
  isSessionValid(platform: PlatformType): boolean {
    const session = this.sessions.get(platform)
    return session !== null && session.status === 'active' && Date.now() < session.expiresAt
  }

  /**
   * 获取会话统计
   */
  getStats(platform: PlatformType): SessionStats {
    return (
      this.stats.get(platform) || {
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0
      }
    )
  }

  /**
   * 记录请求结果
   */
  recordRequest(platform: PlatformType, success: boolean, responseTime: number): void {
    const stats = this.stats.get(platform)
    if (!stats) return

    stats.totalRequests++
    if (success) {
      stats.successCount++
    } else {
      stats.failureCount++
    }

    // 更新平均响应时间
    stats.avgResponseTime =
      (stats.avgResponseTime * (stats.totalRequests - 1) + responseTime) / stats.totalRequests

    // 更新会话请求计数
    const session = this.sessions.get(platform)
    if (session) {
      session.requestCount++
    }
  }

  /**
   * 订阅会话变化  // 貌似没作用
   */
  subscribe(callback: SessionChangeCallback): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initStats(platform: PlatformType): void {
    this.stats.set(platform, {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0
    })
  }

  private updateSessionStatus(platform: PlatformType, status: SessionStatus): void {
    const session = this.sessions.get(platform)
    if (session) {
      session.status = status
      this.notifySubscribers(platform, session)
    }
  }



  // 貌似没用
  private notifySubscribers(platform: PlatformType, session: ExecutionSession | null): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(platform, session)
      } catch (error) {
        console.error('会话变化回调执行失败:', error)
      }
    })
  }

  private startRefreshTimer(platform: PlatformType): void {
    this.stopRefreshTimer(platform)

    const timer = setInterval(async () => {
      const session = this.sessions.get(platform)
      if (!session || session.status !== 'active') {
        this.stopRefreshTimer(platform)
        return
      }

      const now = Date.now()
      if (now >= session.expiresAt - session.refreshWindow) {
        try {
          await this.refreshSession(platform)
        } catch (error) {
          console.error(`平台 ${platform} 自动刷新失败:`, error)
        }
      }
    }, REFRESH_CHECK_INTERVAL)

    this.refreshTimers.set(platform, timer)
  }

  private stopRefreshTimer(platform: PlatformType): void {
    const timer = this.refreshTimers.get(platform)
    if (timer) {
      clearInterval(timer)
      this.refreshTimers.delete(platform)
    }
  }

  private startGlobalRefreshCheck(): void {
    // 全局定时检查所有会话状态
    setInterval(() => {
      const now = Date.now()
      this.sessions.forEach((session, platform) => {
        if (session.status === 'active' && now >= session.expiresAt) {
          this.updateSessionStatus(platform, 'expired')
        }
      })
    }, REFRESH_CHECK_INTERVAL)
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const executionSessionManager: ExecutionSessionManager = new ExecutionSessionManagerImpl()