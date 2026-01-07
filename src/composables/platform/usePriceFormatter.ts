/**
 * 价格格式化 Composable
 *
 * 提供价格和利润的格式化显示
 */

import { computed } from 'vue'
import { PlatformType } from '@/config/platform.config'

// ============================================================================
// 货币配置
// ============================================================================

export interface CurrencyConfig {
  type: 'CNY' | 'USD'
  symbol: string
  name: string
  decimals: number
}

export const CURRENCY_CONFIGS: Record<'CNY' | 'USD', CurrencyConfig> = {
  CNY: {
    type: 'CNY',
    symbol: '¥',
    name: '人民币',
    decimals: 2
  },
  USD: {
    type: 'USD',
    symbol: '$',
    name: '美元',
    decimals: 2
  }
}

/**
 * 获取平台货币类型
 */
export function getPlatformCurrency(platform: PlatformType): 'CNY' | 'USD' {
  return platform === PlatformType.MARKET ? 'USD' : 'CNY'
}

/**
 * 获取平台货币符号
 */
export function getPlatformCurrencySymbol(platform: PlatformType): string {
  return CURRENCY_CONFIGS[getPlatformCurrency(platform)].symbol
}

// ============================================================================
// 格式化函数
// ============================================================================

/**
 * 格式化价格（人民币）
 */
export function formatCNY(price: number | undefined | null, decimals: number = 2): string {
  if (price === undefined || price === null) return '-'
  return `¥${price.toFixed(decimals)}`
}

/**
 * 格式化价格（美元）
 */
export function formatUSD(price: number | undefined | null, decimals: number = 2): string {
  if (price === undefined || price === null) return '-'
  return `$${price.toFixed(decimals)}`
}

/**
 * 根据平台格式化价格
 */
export function formatPlatformPrice(
  price: number | undefined | null,
  platform: PlatformType,
  decimals: number = 2
): string {
  if (price === undefined || price === null) return '-'
  const symbol = getPlatformCurrencySymbol(platform)
  return `${symbol}${price.toFixed(decimals)}`
}

/**
 * 格式化利润（带正负号，始终使用人民币）
 */
export function formatProfit(profit: number | undefined | null, decimals: number = 2): string {
  if (profit === undefined || profit === null) return '-'
  const sign = profit >= 0 ? '+' : ''
  return `${sign}¥${profit.toFixed(decimals)}`
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * 格式化成本价（始终使用人民币）
 */
export function formatCostPrice(price: number | undefined | null, decimals: number = 2): string {
  if (price === undefined || price === null) return '未设置'
  return `¥${price.toFixed(decimals)}`
}

// ============================================================================
// Composable
// ============================================================================

/**
 * 价格格式化 Composable
 *
 * 提供平台相关的价格格式化方法
 */
export function usePriceFormatter(platform?: () => PlatformType) {
  const getPlatform = (): PlatformType => {
    return platform?.() || PlatformType.MARKET
  }

  /**
   * 获取货币类型
   */
  const getCurrencyType = () => {
    return getPlatformCurrency(getPlatform())
  }

  /**
   * 获取货币符号
   */
  const getCurrencySymbol = () => {
    return getPlatformCurrencySymbol(getPlatform())
  }

  /**
   * 获取货币配置
   */
  const getCurrencyConfig = () => {
    return CURRENCY_CONFIGS[getCurrencyType()]
  }

  /**
   * 格式化价格（根据当前平台）
   */
  const formatPrice = (price: number | undefined | null, decimals: number = 2): string => {
    return formatPlatformPrice(price, getPlatform(), decimals)
  }

  /**
   * 是否使用美元
   */
  const isUSD = computed(() => getCurrencyType() === 'USD')

  /**
   * 是否使用人民币
   */
  const isCNY = computed(() => getCurrencyType() === 'CNY')

  return {
    // 货币信息
    getCurrencyType,
    getCurrencySymbol,
    getCurrencyConfig,
    isUSD,
    isCNY,

    // 格式化方法
    formatPrice,
    formatCNY,
    formatUSD,
    formatPlatformPrice,
    formatProfit,
    formatPercent,
    formatCostPrice
  }
}

// ============================================================================
// 类型导出
// ============================================================================

export type UsePriceFormatterReturn = ReturnType<typeof usePriceFormatter>
