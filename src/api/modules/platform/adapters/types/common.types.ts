/**
 * 适配器公共类型定义
 */

import type { PlatformType } from '@/config/platform.config'

/**
 * API 响应基础接口
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 请求配置
 */
export interface RequestConfig {
  /** 取消信号 */
  signal?: AbortSignal
  /** 超时时间 */
  timeout?: number
  /** 是否显示加载 */
  showLoading?: boolean
}

/**
 * 平台费率配置
 */
export interface PlatformFeeConfig {
  /** 平台类型 */
  platform: PlatformType
  /** 平台费率 */
  platformFee: number
  /** 提现费率 */
  withdrawFee?: number
  /** 额外费率 */
  additionalFee?: number
}

/**
 * 货币类型
 */
export type CurrencyType = 'CNY' | 'USD'

/**
 * 货币配置
 */
export interface CurrencyConfig {
  /** 货币类型 */
  type: CurrencyType
  /** 符号 */
  symbol: string
  /** 名称 */
  name: string
  /** 小数位数 */
  decimals: number
}

/**
 * 平台货币配置映射
 */
export const PLATFORM_CURRENCY: Record<PlatformType, CurrencyConfig> = {
  MARKET: {
    type: 'USD',
    symbol: '$',
    name: '美元',
    decimals: 2
  },
  CSGOBUY: {
    type: 'CNY',
    symbol: '¥',
    name: '人民币',
    decimals: 2
  },
  BUFF: {
    type: 'CNY',
    symbol: '¥',
    name: '人民币',
    decimals: 2
  }
}

/**
 * 平台费率配置映射
 */
export const PLATFORM_FEES: Record<PlatformType, PlatformFeeConfig> = {
  MARKET: {
    platform: 'MARKET' as PlatformType,
    platformFee: 0.05, // 5%
    withdrawFee: 0.05, // 5%
    additionalFee: 0.04 // 汇率差
  },
  CSGOBUY: {
    platform: 'CSGOBUY' as PlatformType,
    platformFee: 0.05, // 5%
    withdrawFee: 0.01 // 1%
  },
  BUFF: {
    platform: 'BUFF' as PlatformType,
    platformFee: 0.025, // 2.5%
    withdrawFee: 0
  }
}
