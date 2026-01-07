/**
 * 自动化引擎类型定义
 */

/**
 * 任务状态
 */
export type TaskStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error'

/**
 * 任务配置
 */
export interface TaskConfig {
  /** 执行间隔（最小 300ms） */
  interval: number
  /** 最大重试次数 */
  maxRetries: number
  /** 超时时间 */
  timeout: number
  /** 是否自动调价 */
  autoAdjustPrice?: boolean
}

/**
 * 任务日志
 */
export interface TaskLog {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: Record<string, unknown>
}

/**
 * 任务统计
 */
export interface TaskStats {
  totalTicks: number
  successTicks: number
  failedTicks: number
  consecutiveErrors: number
  lastTickAt: number
  avgTickDuration: number
}

/**
 * 任务执行回调
 */
export interface TaskCallbacks {
  /** 每次执行时调用 */
  onTick: () => Promise<void>
  /** 执行出错时调用 */
  onError?: (error: Error) => void
  /** 状态变化时调用 */
  onStatusChange?: (status: TaskStatus) => void
  /** 日志输出时调用 */
  onLog?: (log: TaskLog) => void
}

/**
 * 任务运行器接口
 */
export interface ITaskRunner {
  /** 当前状态 */
  readonly status: TaskStatus
  /** 任务配置 */
  readonly config: TaskConfig
  /** 任务统计 */
  readonly stats: TaskStats
  /** 日志列表 */
  readonly logs: TaskLog[]

  /** 启动任务 */
  start(): void
  /** 暂停任务 */
  pause(): void
  /** 恢复任务 */
  resume(): void
  /** 停止任务 */
  stop(): void
  /** 重置任务 */
  reset(): void
  /** 更新配置 */
  updateConfig(config: Partial<TaskConfig>): void
  /** 清除日志 */
  clearLogs(): void
}

/**
 * 默认任务配置
 */
export const DEFAULT_TASK_CONFIG: TaskConfig = {
  interval: 300,
  maxRetries: 3,
  timeout: 5000,
  autoAdjustPrice: false
}