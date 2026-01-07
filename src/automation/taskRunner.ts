/**
 * 任务执行器（应用级单例）
 *
 * 与 Vue 生命周期解耦
 * 高频执行自动化任务（默认 300ms 间隔）
 * 支持暂停、恢复、停止
 * 内置错误处理和重试机制
 */

import { executionSessionManager } from '@/composables/platform/platform-access'
import { PlatformType } from '@/config/platform.config'
import type {
  TaskStatus,
  TaskConfig,
  TaskLog,
  TaskStats,
  TaskCallbacks,
  ITaskRunner
} from './engine/types'
import { DEFAULT_TASK_CONFIG } from './engine/types'

/**
 * 最大日志数量
 */
const MAX_LOGS = 100

/**
 * 任务执行器实现
 */
class TaskRunnerImpl implements ITaskRunner {
  private _status: TaskStatus = 'idle'
  private _config: TaskConfig = { ...DEFAULT_TASK_CONFIG }
  private _stats: TaskStats = this.createInitialStats()
  private _logs: TaskLog[] = []

  private timer: ReturnType<typeof setTimeout> | null = null
  private isExecuting = false
  private callbacks: TaskCallbacks | null = null
  private platform: PlatformType | null = null

  // ============================================================================
  // Public Properties
  // ============================================================================

  get status(): TaskStatus {
    return this._status
  }

  get config(): TaskConfig {
    return { ...this._config }
  }

  get stats(): TaskStats {
    return { ...this._stats }
  }

  get logs(): TaskLog[] {
    return [...this._logs]
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * 初始化任务
   */
  initialize(
    platform: PlatformType,
    callbacks: TaskCallbacks,
    config?: Partial<TaskConfig>
  ): void {
    this.platform = platform
    this.callbacks = callbacks

    if (config) {
      this.updateConfig(config)
    }
  }

  // ============================================================================
  // Control Methods
  // ============================================================================

  /**
   * 启动任务
   */
  start(): void {
    if (this._status === 'running') {
      this.addLog('warn', '任务已在运行中')
      return
    }

    if (!this.platform) {
      this.addLog('error', '未初始化平台')
      return
    }

    // 检查会话是否有效
    if (!executionSessionManager.isSessionValid(this.platform)) {
      this.addLog('error', '执行会话无效，请先解锁 API Key')
      return
    }

    this.setStatus('running')
    this._stats.consecutiveErrors = 0

    this.addLog('info', '任务启动', {
      platform: this.platform,
      interval: this._config.interval,
      maxRetries: this._config.maxRetries
    })

    // 立即执行第一次
    this.executeTick()
  }

  /**
   * 暂停任务
   */
  pause(): void {
    if (this._status !== 'running') {
      this.addLog('warn', '任务未在运行中，无法暂停')
      return
    }

    this.clearTimer()
    this.setStatus('paused')
    this.addLog('info', '任务已暂停')
  }

  /**
   * 恢复任务
   */
  resume(): void {
    if (this._status !== 'paused') {
      this.addLog('warn', '任务未暂停，无法恢复')
      return
    }

    this.setStatus('running')
    this.addLog('info', '任务已恢复')

    // 立即执行
    this.executeTick()
  }

  /**
   * 停止任务
   */
  stop(): void {
    if (this._status === 'idle' || this._status === 'stopped') {
      return
    }

    this.clearTimer()
    this.setStatus('stopped')
    this.addLog('info', `任务已停止，共执行 ${this._stats.totalTicks} 次`)
  }

  /**
   * 重置任务
   */
  reset(): void {
    this.stop()
    this._stats = this.createInitialStats()
    this._logs = []
    this.setStatus('idle')
    this.addLog('info', '任务已重置')
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<TaskConfig>): void {
    // 验证间隔
    if (newConfig.interval !== undefined && newConfig.interval < 300) {
      this.addLog('warn', '执行间隔不能小于 300ms，已自动调整')
      newConfig.interval = 300
    }

    this._config = {
      ...this._config,
      ...newConfig
    }

    this.addLog('info', '配置已更新', { config: this._config })
  }

  /**
   * 清除日志
   */
  clearLogs(): void {
    this._logs = []
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * 执行单次 tick
   */
  private async executeTick(): Promise<void> {
    if (this._status !== 'running' || this.isExecuting) {
      return
    }

    if (!this.platform || !this.callbacks) {
      return
    }

    this.isExecuting = true
    const startTime = Date.now()

    try {
      // 通过平台访问层获取有效 token（确保 token 有效）
      await executionSessionManager.getValidToken(this.platform)

      // 调用用户定义的 tick 回调
      await Promise.race([
        this.callbacks.onTick(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('执行超时')), this._config.timeout)
        )
      ])

      const duration = Date.now() - startTime

      this._stats.totalTicks++
      this._stats.successTicks++
      this._stats.lastTickAt = Date.now()
      this._stats.consecutiveErrors = 0

      // 更新平均执行时间
      this.updateAvgDuration(duration)

      // 记录请求统计
      executionSessionManager.recordRequest(this.platform, true, duration)

      // 调度下一次执行
      this.scheduleNextTick()
    } catch (err) {
      const duration = Date.now() - startTime
      this._stats.totalTicks++
      this._stats.failedTicks++
      this._stats.consecutiveErrors++

      // 记录请求统计
      if (this.platform) {
        executionSessionManager.recordRequest(this.platform, false, duration)
      }

      const errorMessage = err instanceof Error ? err.message : '未知错误'
      this.addLog('error', `执行失败: ${errorMessage}`, {
        tickCount: this._stats.totalTicks,
        consecutiveErrors: this._stats.consecutiveErrors
      })

      // 调用错误回调
      this.callbacks.onError?.(err instanceof Error ? err : new Error(errorMessage))

      // 检查是否超过最大重试次数
      if (this._stats.consecutiveErrors >= this._config.maxRetries) {
        this.addLog('error', `连续失败 ${this._stats.consecutiveErrors} 次，任务已停止`)
        this.setStatus('error')
      } else {
        // 使用退避策略重试
        const delay = this.calculateBackoff(this._stats.consecutiveErrors)
        this.addLog(
          'warn',
          `将在 ${delay}ms 后重试 (${this._stats.consecutiveErrors}/${this._config.maxRetries})`
        )
        this.scheduleNextTick(delay)
      }
    } finally {
      this.isExecuting = false
    }
  }

  /**
   * 调度下一次执行
   */
  private scheduleNextTick(delay?: number): void {
    if (this._status !== 'running') {
      return
    }

    this.clearTimer()

    const interval = delay ?? this._config.interval
    this.timer = setTimeout(() => this.executeTick(), interval)
  }

  /**
   * 清除定时器
   */
  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /**
   * 计算退避延迟
   */
  private calculateBackoff(errorCount: number): number {
    const baseDelay = 1000
    const maxDelay = 30000
    const jitter = 0.1

    let delay = baseDelay * Math.pow(2, errorCount - 1)
    delay = Math.min(delay, maxDelay)

    // 添加抖动
    const jitterAmount = delay * jitter
    delay += Math.random() * jitterAmount * 2 - jitterAmount

    return Math.round(delay)
  }

  /**
   * 设置状态
   */
  private setStatus(newStatus: TaskStatus): void {
    const oldStatus = this._status
    this._status = newStatus

    this.addLog('info', `状态变更: ${oldStatus} -> ${newStatus}`)
    this.callbacks?.onStatusChange?.(newStatus)
  }

  /**
   * 添加日志
   */
  private addLog(
    level: TaskLog['level'],
    message: string,
    data?: Record<string, unknown>
  ): void {
    const log: TaskLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level,
      message,
      data
    }

    this._logs.unshift(log)

    // 限制日志数量
    if (this._logs.length > MAX_LOGS) {
      this._logs.pop()
    }

    // 调用外部回调
    this.callbacks?.onLog?.(log)
  }

  /**
   * 更新平均执行时间
   */
  private updateAvgDuration(duration: number): void {
    const count = this._stats.successTicks
    this._stats.avgTickDuration =
      (this._stats.avgTickDuration * (count - 1) + duration) / count
  }

  /**
   * 创建初始统计
   */
  private createInitialStats(): TaskStats {
    return {
      totalTicks: 0,
      successTicks: 0,
      failedTicks: 0,
      consecutiveErrors: 0,
      lastTickAt: 0,
      avgTickDuration: 0
    }
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const taskRunner = new TaskRunnerImpl()

// 导出类型
export type { TaskStatus, TaskConfig, TaskLog, TaskStats, TaskCallbacks, ITaskRunner }