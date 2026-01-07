/**
 * 任务调度器
 *
 * 管理多平台的任务执行
 * 支持定时任务调度
 * 与 Vue 生命周期解耦
 */

import { executionSessionManager } from '@/composables/platform/platform-access'
import { PlatformType } from '@/config/platform.config'
import type { TaskConfig, TaskCallbacks, TaskStatus } from './engine/types'
import { DEFAULT_TASK_CONFIG } from './engine/types'

/**
 * 平台任务实例
 */
interface PlatformTask {
  platform: PlatformType
  status: TaskStatus
  config: TaskConfig
  callbacks: TaskCallbacks
  timer: ReturnType<typeof setTimeout> | null
  isExecuting: boolean
  stats: {
    totalTicks: number
    consecutiveErrors: number
    lastTickAt: number
  }
}

/**
 * 任务调度器实现
 */
class TaskSchedulerImpl {
  private tasks = new Map<PlatformType, PlatformTask>()

  /**
   * 注册任务
   */
  register(
    platform: PlatformType,
    callbacks: TaskCallbacks,
    config?: Partial<TaskConfig>
  ): void {
    if (this.tasks.has(platform)) {
      this.unregister(platform)
    }

    const task: PlatformTask = {
      platform,
      status: 'idle',
      config: { ...DEFAULT_TASK_CONFIG, ...config },
      callbacks,
      timer: null,
      isExecuting: false,
      stats: {
        totalTicks: 0,
        consecutiveErrors: 0,
        lastTickAt: 0
      }
    }

    this.tasks.set(platform, task)
  }

  /**
   * 注销任务
   */
  unregister(platform: PlatformType): void {
    const task = this.tasks.get(platform)
    if (task) {
      this.stop(platform)
      this.tasks.delete(platform)
    }
  }

  /**
   * 启动任务
   */
  start(platform: PlatformType): boolean {
    const task = this.tasks.get(platform)
    if (!task) {
      console.error(`[TaskScheduler] 任务未注册: ${platform}`)
      return false
    }

    if (task.status === 'running') {
      console.warn(`[TaskScheduler] 任务已在运行: ${platform}`)
      return false
    }

    // 检查会话是否有效
    if (!executionSessionManager.isSessionValid(platform)) {
      console.error(`[TaskScheduler] 执行会话无效: ${platform}`)
      return false
    }

    task.status = 'running'
    task.stats.consecutiveErrors = 0
    task.callbacks.onStatusChange?.(task.status)

    // 开始执行
    this.executeTick(task)

    return true
  }

  /**
   * 暂停任务
   */
  pause(platform: PlatformType): boolean {
    const task = this.tasks.get(platform)
    if (!task || task.status !== 'running') {
      return false
    }

    this.clearTimer(task)
    task.status = 'paused'
    task.callbacks.onStatusChange?.(task.status)

    return true
  }

  /**
   * 恢复任务
   */
  resume(platform: PlatformType): boolean {
    const task = this.tasks.get(platform)
    if (!task || task.status !== 'paused') {
      return false
    }

    task.status = 'running'
    task.callbacks.onStatusChange?.(task.status)

    this.executeTick(task)

    return true
  }

  /**
   * 停止任务
   */
  stop(platform: PlatformType): boolean {
    const task = this.tasks.get(platform)
    if (!task) {
      return false
    }

    this.clearTimer(task)
    task.status = 'stopped'
    task.callbacks.onStatusChange?.(task.status)

    return true
  }

  /**
   * 停止所有任务
   */
  stopAll(): void {
    for (const platform of this.tasks.keys()) {
      this.stop(platform)
    }
  }

  /**
   * 获取任务状态
   */
  getStatus(platform: PlatformType): TaskStatus | null {
    return this.tasks.get(platform)?.status ?? null
  }

  /**
   * 获取所有运行中的任务
   */
  getRunningTasks(): PlatformType[] {
    const running: PlatformType[] = []
    for (const [platform, task] of this.tasks) {
      if (task.status === 'running') {
        running.push(platform)
      }
    }
    return running
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * 执行单次 tick
   */
  private async executeTick(task: PlatformTask): Promise<void> {
    if (task.status !== 'running' || task.isExecuting) {
      return
    }

    task.isExecuting = true
    const startTime = Date.now()

    try {
      // 通过平台访问层获取有效 token
      await executionSessionManager.getValidToken(task.platform)

      // 执行任务
      await Promise.race([
        task.callbacks.onTick(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('执行超时')), task.config.timeout)
        )
      ])

      const duration = Date.now() - startTime

      task.stats.totalTicks++
      task.stats.lastTickAt = Date.now()
      task.stats.consecutiveErrors = 0

      // 记录请求统计
      executionSessionManager.recordRequest(task.platform, true, duration)

      // 调度下一次
      this.scheduleNextTick(task)
    } catch (err) {
      const duration = Date.now() - startTime
      task.stats.totalTicks++
      task.stats.consecutiveErrors++

      executionSessionManager.recordRequest(task.platform, false, duration)

      task.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))

      if (task.stats.consecutiveErrors >= task.config.maxRetries) {
        task.status = 'error'
        task.callbacks.onStatusChange?.(task.status)
      } else {
        const delay = this.calculateBackoff(task.stats.consecutiveErrors)
        this.scheduleNextTick(task, delay)
      }
    } finally {
      task.isExecuting = false
    }
  }

  /**
   * 调度下一次执行
   */
  private scheduleNextTick(task: PlatformTask, delay?: number): void {
    if (task.status !== 'running') {
      return
    }

    this.clearTimer(task)

    const interval = delay ?? task.config.interval
    task.timer = setTimeout(() => this.executeTick(task), interval)
  }

  /**
   * 清除定时器
   */
  private clearTimer(task: PlatformTask): void {
    if (task.timer) {
      clearTimeout(task.timer)
      task.timer = null
    }
  }

  /**
   * 计算退避延迟
   */
  private calculateBackoff(errorCount: number): number {
    const baseDelay = 1000
    const maxDelay = 30000
    let delay = baseDelay * Math.pow(2, errorCount - 1)
    return Math.min(delay, maxDelay)
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const taskScheduler = new TaskSchedulerImpl()