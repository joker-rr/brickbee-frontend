/**
 * Market 自动化脚本模块类型定义
 *
 * 包含脚本运行、代理请求、价格策略等类型
 */

import type { PlatformType } from '@/config/platform.config'

/**
 * 脚本运行状态
 */
export type ScriptStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error'

/**
 * 脚本配置
 */
export interface ScriptConfig {
  /** 执行间隔 (ms)，最小 300ms */
  interval: number
  /** 最大重试次数 */
  maxRetries: number
  /** 请求超时 (ms) */
  timeout: number
  /** 是否启用自动改价 */
  autoAdjustPrice: boolean
  /** 价格策略 */
  priceStrategy?: PriceStrategy
}

/**
 * 默认脚本配置
 */
export const DEFAULT_SCRIPT_CONFIG: ScriptConfig = {
  interval: 300,
  maxRetries: 3,
  timeout: 5000,
  autoAdjustPrice: false
}

/**
 * 价格策略类型
 */
export type PriceStrategyType = 'lowest' | 'undercut' | 'fixed' | 'percentage'

/**
 * 价格策略配置
 */
export interface PriceStrategy {
  /** 策略类型 */
  type: PriceStrategyType
  /** 低于最低价的金额（undercut 策略） */
  undercutAmount?: number
  /** 固定价格（fixed 策略） */
  fixedPrice?: number
  /** 利润百分比（percentage 策略） */
  profitPercentage?: number
  /** 最低价格限制 */
  minPrice?: number
  /** 最高价格限制 */
  maxPrice?: number
}

/**
 * Market API 代理请求
 */
export interface MarketProxyRequest {
  /** 动作名称（白名单中的动作） */
  action: MarketAction
  /** 动作参数 */
  params?: Record<string, unknown>
  /** 请求 ID（可选，用于追踪） */
  requestId?: string
}

/**
 * Market API 代理响应
 */
export interface MarketProxyResponse<T = unknown> {
  /** 是否成功 */
  success: boolean
  /** 响应数据 */
  data?: T
  /** 请求 ID */
  requestId: string
  /** 错误信息 */
  error?: string
  /** 错误码 */
  errorCode?: MarketProxyErrorCode
}

/**
 * Market API 允许的动作（白名单）
 */
export type MarketAction =
  // 库存相关
  | 'getInventory'
  | 'getItemInfo'
  // 在售相关
  | 'getSelling'
  | 'setPrice'
  | 'removeItem'
  // 价格相关
  | 'getPrices'
  | 'getMinPrices'
  // 交易相关
  | 'getOrders'
  | 'buyItem'
  // 账户相关（只读）
  | 'getBalance'

/**
 * Market 代理错误码
 */
export type MarketProxyErrorCode =
  | 'INVALID_ACTION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MARKET_API_ERROR'
  | 'MARKET_API_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'EXECUTION_TOKEN_INVALID'

/**
 * 请求统计
 */
export interface RequestStats {
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successRequests: number
  /** 失败请求数 */
  failedRequests: number
  /** 平均响应时间 (ms) */
  avgResponseTime: number
  /** 最后请求时间 */
  lastRequestAt: number
  /** 当前限流状态 */
  rateLimitStatus?: RateLimitStatus
}

/**
 * 限流状态
 */
export interface RateLimitStatus {
  /** 剩余请求数 */
  remaining: number
  /** 限制总数 */
  limit: number
  /** 重置时间戳 */
  resetAt: number
}

/**
 * 最低价格结果
 */
export interface MinPriceResult {
  /** 市场哈希名称 */
  marketHashName: string
  /** 最低价格 (USD) */
  minPrice: number
  /** 在售数量 */
  count: number
  /** 查询时间 */
  queriedAt: number
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 是否成功 */
  success: boolean
  /** 成功数量 */
  successCount: number
  /** 失败数量 */
  failedCount: number
  /** 错误详情 */
  errors: Array<{
    itemId: string
    error: string
  }>
}

/**
 * 价格调整结果
 */
export interface PriceAdjustResult {
  /** 物品 ID */
  itemId: string
  /** 是否成功 */
  success: boolean
  /** 原价格 */
  oldPrice: number
  /** 新价格 */
  newPrice: number
  /** 错误信息 */
  error?: string
}

/**
 * 脚本运行日志
 */
export interface ScriptLog {
  /** 日志 ID */
  id: string
  /** 时间戳 */
  timestamp: number
  /** 日志级别 */
  level: 'info' | 'warn' | 'error' | 'debug'
  /** 消息 */
  message: string
  /** 附加数据 */
  data?: Record<string, unknown>
}

/**
 * 脚本运行器选项
 */
export interface ScriptRunnerOptions {
  /** 脚本配置 */
  config: ScriptConfig
  /** 平台类型 */
  platform: PlatformType
  /** 运行回调 */
  onTick?: () => Promise<void>
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 状态变化回调 */
  onStatusChange?: (status: ScriptStatus) => void
  /** 日志回调 */
  onLog?: (log: ScriptLog) => void
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 初始延迟 (ms) */
  initialDelay: number
  /** 延迟倍数 */
  multiplier: number
  /** 最大延迟 (ms) */
  maxDelay: number
  /** 抖动比例 */
  jitter: number
  /** 最大重试次数 */
  maxRetries: number
  /** 需要重试的错误 */
  retryOn: Array<string | number>
  /** 不重试的错误 */
  noRetryOn: Array<string | number>
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  initialDelay: 1000,
  multiplier: 2,
  maxDelay: 30000,
  jitter: 0.1,
  maxRetries: 3,
  retryOn: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 502, 503, 504],
  noRetryOn: [400, 401, 403, 429]
}
