/**
 * 脚本执行器 Composable
 *
 * 高频执行自动化脚本（默认 300ms 间隔）
 * 支持暂停、恢复、停止
 * 内置错误处理和重试机制
 */

import { ref, computed, onBeforeUnmount, watch } from 'vue'
import type {
  ScriptStatus,
  ScriptConfig,
  ScriptLog,
  ScriptRunnerOptions,
  DEFAULT_SCRIPT_CONFIG,
  DEFAULT_RETRY_CONFIG
} from '@/types/market-automation'
import { logger } from '@/utils/logger'

/**
 * 默认脚本配置
 */
const DEFAULT_CONFIG: ScriptConfig = {
  interval: 300,
  maxRetries: 3,
  timeout: 5000,
  autoAdjustPrice: false
}

/**
 * 最大日志数量
 */
const MAX_LOGS = 100

/**
 * 脚本执行器 Composable
 */
export function useScriptRunner(options?: Partial<ScriptRunnerOptions>) {
  /** 脚本状态 */
  const status = ref<ScriptStatus>('idle')

  /** 脚本配置 */
  const config = ref<ScriptConfig>({
    ...DEFAULT_CONFIG,
    ...options?.config
  })

  /** 执行定时器 */
  const timer = ref<ReturnType<typeof setTimeout> | null>(null)

  /** 运行日志 */
  const logs = ref<ScriptLog[]>([])

  /** 当前运行次数 */
  const tickCount = ref(0)

  /** 连续错误次数 */
  const consecutiveErrors = ref(0)

  /** 是否正在执行 tick */
  const isExecuting = ref(false)

  /** 最后执行时间 */
  const lastTickAt = ref(0)

  // 计算属性
  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isStopped = computed(() => status.value === 'stopped' || status.value === 'idle')
  const isError = computed(() => status.value === 'error')

  /**
   * 添加日志
   */
  function addLog(level: ScriptLog['level'], message: string, data?: Record<string, unknown>): void {
    const log: ScriptLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level,
      message,
      data
    }

    logs.value.unshift(log)

    // 限制日志数量
    if (logs.value.length > MAX_LOGS) {
      logs.value.pop()
    }

    // 调用外部回调
    options?.onLog?.(log)

    // 同步到 logger
    switch (level) {
      case 'error':
        logger.error(`[ScriptRunner] ${message}`, data)
        break
      case 'warn':
        logger.warn(`[ScriptRunner] ${message}`, data)
        break
      case 'debug':
        logger.log(`[ScriptRunner] ${message}`, data)
        break
      default:
        logger.log(`[ScriptRunner] ${message}`, data)
    }
  }

  /**
   * 执行单次 tick
   */
  async function executeTick(): Promise<void> {
    if (status.value !== 'running' || isExecuting.value) {
      return
    }

    isExecuting.value = true
    const startTime = Date.now()

    try {
      // 调用用户定义的 tick 回调
      if (options?.onTick) {
        await Promise.race([
          options.onTick(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('执行超时')), config.value.timeout)
          )
        ])
      }

      tickCount.value++
      lastTickAt.value = Date.now()
      consecutiveErrors.value = 0

      // 调度下一次执行
      scheduleNextTick()
    } catch (err) {
      consecutiveErrors.value++

      const errorMessage = err instanceof Error ? err.message : '未知错误'
      addLog('error', `执行失败: ${errorMessage}`, {
        tickCount: tickCount.value,
        consecutiveErrors: consecutiveErrors.value
      })

      // 调用错误回调
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage))

      // 检查是否超过最大重试次数
      if (consecutiveErrors.value >= config.value.maxRetries) {
        addLog('error', `连续失败 ${consecutiveErrors.value} 次，脚本已停止`)
        setStatus('error')
      } else {
        // 使用退避策略重试
        const delay = calculateBackoff(consecutiveErrors.value)
        addLog('warn', `将在 ${delay}ms 后重试 (${consecutiveErrors.value}/${config.value.maxRetries})`)
        scheduleNextTick(delay)
      }
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * 调度下一次执行
   */
  function scheduleNextTick(delay?: number): void {
    if (status.value !== 'running') {
      return
    }

    // 清除现有定时器
    if (timer.value) {
      clearTimeout(timer.value)
    }

    const interval = delay ?? config.value.interval
    timer.value = setTimeout(executeTick, interval)
  }

  /**
   * 计算退避延迟
   */
  function calculateBackoff(errorCount: number): number {
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
  function setStatus(newStatus: ScriptStatus): void {
    const oldStatus = status.value
    status.value = newStatus

    addLog('info', `状态变更: ${oldStatus} -> ${newStatus}`)
    options?.onStatusChange?.(newStatus)
  }

  /**
   * 启动脚本
   */
  function start(): void {
    if (status.value === 'running') {
      addLog('warn', '脚本已在运行中')
      return
    }

    setStatus('running')
    consecutiveErrors.value = 0

    addLog('info', '脚本启动', {
      interval: config.value.interval,
      maxRetries: config.value.maxRetries
    })

    // 立即执行第一次
    executeTick()
  }

  /**
   * 暂停脚本
   */
  function pause(): void {
    if (status.value !== 'running') {
      addLog('warn', '脚本未在运行中，无法暂停')
      return
    }

    // 停止定时器
    if (timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }

    setStatus('paused')
    addLog('info', '脚本已暂停')
  }

  /**
   * 恢复脚本
   */
  function resume(): void {
    if (status.value !== 'paused') {
      addLog('warn', '脚本未暂停，无法恢复')
      return
    }

    setStatus('running')
    addLog('info', '脚本已恢复')

    // 立即执行
    executeTick()
  }

  /**
   * 停止脚本
   */
  function stop(): void {
    if (status.value === 'idle' || status.value === 'stopped') {
      return
    }

    // 停止定时器
    if (timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }

    setStatus('stopped')
    addLog('info', `脚本已停止，共执行 ${tickCount.value} 次`)
  }

  /**
   * 重置脚本
   */
  function reset(): void {
    stop()

    tickCount.value = 0
    consecutiveErrors.value = 0
    lastTickAt.value = 0
    logs.value = []

    setStatus('idle')
    addLog('info', '脚本已重置')
  }

  /**
   * 更新配置
   */
  function updateConfig(newConfig: Partial<ScriptConfig>): void {
    // 验证间隔
    if (newConfig.interval !== undefined && newConfig.interval < 300) {
      addLog('warn', '执行间隔不能小于 300ms，已自动调整')
      newConfig.interval = 300
    }

    config.value = {
      ...config.value,
      ...newConfig
    }

    addLog('info', '配置已更新', { config: config.value })
  }

  /**
   * 清除日志
   */
  function clearLogs(): void {
    logs.value = []
  }

  // 组件卸载时停止脚本
  onBeforeUnmount(() => {
    stop()
  })

  // 监听状态变化，在错误状态时自动清理
  watch(status, (newStatus) => {
    if (newStatus === 'error' && timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }
  })

  return {
    // 状态
    status: computed(() => status.value),
    config: computed(() => config.value),
    logs: computed(() => logs.value),
    tickCount: computed(() => tickCount.value),
    consecutiveErrors: computed(() => consecutiveErrors.value),
    lastTickAt: computed(() => lastTickAt.value),

    // 计算属性
    isRunning,
    isPaused,
    isStopped,
    isError,
    isExecuting: computed(() => isExecuting.value),

    // 控制方法
    start,
    pause,
    resume,
    stop,
    reset,

    // 配置方法
    updateConfig,

    // 日志方法
    addLog,
    clearLogs
  }
}
