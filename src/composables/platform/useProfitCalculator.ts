/**
 * 利润计算 Composable
 *
 * 封装各平台的利润计算公式和价格计算逻辑
 * 合并原有的 usePriceCalculator.ts 和 price-calculator.service.ts
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import { PlatformType } from '@/config/platform.config'

// ============================================================================
// 平台费率配置
// ============================================================================

/**
 * 平台费率配置
 */
export interface PlatformFeeConfig {
  /** 平台费率 */
  platformFee: number
  /** 提现费率 */
  withdrawFee: number
  /** 汇率差（仅 MARKET） */
  exchangeRateDiff?: number
  /** 默认汇率（仅 MARKET） */
  defaultExchangeRate?: number
}

/**
 * 各平台费率配置
 */
export const PLATFORM_FEES: Record<PlatformType, PlatformFeeConfig> = {
  [PlatformType.MARKET]: {
    platformFee: 0.05,
    withdrawFee: 0.05,
    exchangeRateDiff: 0.04,
    defaultExchangeRate: 7
  },
  [PlatformType.CSGOBUY]: {
    platformFee: 0.05,
    withdrawFee: 0.01
  },
  [PlatformType.BUFF]: {
    platformFee: 0.025,
    withdrawFee: 0
  }
}

// ============================================================================
// 纯函数：利润计算
// ============================================================================

/**
 * 计算 MARKET 平台利润
 *
 * 公式: price × (exchangeRate - 0.04) × 0.95 × 0.95 - cost
 * - 汇率差：0.04
 * - 平台费率：5%
 * - 提现费率：5%
 */
export function calculateMarketProfit(
  marketPrice: number,
  costPrice: number,
  exchangeRate: number = 7
): number {
  if (!marketPrice || !costPrice) return 0
  const fees = PLATFORM_FEES[PlatformType.MARKET]
  const effectiveRate = exchangeRate - (fees.exchangeRateDiff || 0)
  const sellPrice = marketPrice * effectiveRate * (1 - fees.platformFee) * (1 - fees.withdrawFee)
  return Number((sellPrice - costPrice).toFixed(2))
}

/**
 * 计算 CSGOBUY 平台利润
 *
 * 公式: price × 0.95 × 0.99 - cost
 * - 平台费率：5%
 * - 提现费率：1%
 */
export function calculateCsgobuyProfit(marketPrice: number, costPrice: number): number {
  if (!marketPrice || !costPrice) return 0
  const fees = PLATFORM_FEES[PlatformType.CSGOBUY]
  const sellPrice = marketPrice * (1 - fees.platformFee) * (1 - fees.withdrawFee)
  return Number((sellPrice - costPrice).toFixed(2))
}

/**
 * 计算 BUFF 平台利润
 *
 * 公式: price × 0.975 - cost
 * - 平台费率：2.5%
 */
export function calculateBuffProfit(marketPrice: number, costPrice: number): number {
  if (!marketPrice || !costPrice) return 0
  const fees = PLATFORM_FEES[PlatformType.BUFF]
  const sellPrice = marketPrice * (1 - fees.platformFee)
  return Number((sellPrice - costPrice).toFixed(2))
}

/**
 * 根据平台类型计算利润
 */
export function calculatePlatformProfit(
  platform: PlatformType,
  marketPrice: number,
  costPrice: number,
  exchangeRate?: number
): number {
  switch (platform) {
    case PlatformType.MARKET:
      return calculateMarketProfit(marketPrice, costPrice, exchangeRate)
    case PlatformType.CSGOBUY:
      return calculateCsgobuyProfit(marketPrice, costPrice)
    case PlatformType.BUFF:
      return calculateBuffProfit(marketPrice, costPrice)
    default:
      return 0
  }
}

/**
 * 计算简单利润（无平台费率）
 */
export function calculateSimpleProfit(sellPrice: number, costPrice: number): number {
  return sellPrice - costPrice
}

/**
 * 计算利润率
 */
export function calculateProfitRate(profit: number, costPrice: number): number {
  if (costPrice === 0) return 0
  return (profit / costPrice) * 100
}

// ============================================================================
// 纯函数：批量计算
// ============================================================================

/**
 * 计算总成本
 */
export function calculateTotalCost(
  items: Array<{ costPrice?: number; quantity?: number }>
): number {
  return items.reduce((total, item) => {
    const cost = item.costPrice || 0
    const quantity = item.quantity || 1
    return total + cost * quantity
  }, 0)
}

/**
 * 计算总售价
 */
export function calculateTotalSellPrice(
  items: Array<{ sellPrice?: number; marketPrice?: number; quantity?: number }>
): number {
  return items.reduce((total, item) => {
    const price = item.sellPrice || item.marketPrice || 0
    const quantity = item.quantity || 1
    return total + price * quantity
  }, 0)
}

/**
 * 计算总利润
 */
export function calculateTotalProfit(
  items: Array<{ sellPrice?: number; marketPrice?: number; costPrice?: number; quantity?: number }>
): number {
  const totalSellPrice = calculateTotalSellPrice(items)
  const totalCost = calculateTotalCost(items)
  return totalSellPrice - totalCost
}

// ============================================================================
// Composable：useProfitCalculator
// ============================================================================

/**
 * 利润计算 Composable
 *
 * 提供平台特定的利润计算方法
 */
export function useProfitCalculator(platform?: Ref<PlatformType> | (() => PlatformType)) {
  /**
   * 获取当前平台
   */
  const getPlatform = (): PlatformType => {
    if (!platform) return PlatformType.MARKET
    if (typeof platform === 'function') return platform()
    return platform.value
  }

  /**
   * 获取平台费率配置
   */
  const getFeeConfig = (platform?: PlatformType): PlatformFeeConfig => {
    return PLATFORM_FEES[platform || getPlatform()]
  }

  /**
   * 计算利润
   */
  const calculateProfit = (
    marketPrice: number,
    costPrice: number,
    exchangeRate?: number
  ): number => {
    return calculatePlatformProfit(getPlatform(), marketPrice, costPrice, exchangeRate)
  }

  /**
   * 获取默认汇率
   */
  const getDefaultExchangeRate = (): number => {
    const config = getFeeConfig()
    return config.defaultExchangeRate || 7
  }

  /**
   * 是否需要汇率
   */
  const needsExchangeRate = (): boolean => {
    return getPlatform() === PlatformType.MARKET
  }

  return {
    // 费率配置
    platformFees: PLATFORM_FEES,
    getFeeConfig,
    getDefaultExchangeRate,
    needsExchangeRate,

    // 平台利润计算
    calculateProfit,
    calculateMarketProfit,
    calculateCsgobuyProfit,
    calculateBuffProfit,
    calculatePlatformProfit,

    // 通用计算
    calculateSimpleProfit,
    calculateProfitRate,
    calculateTotalCost,
    calculateTotalSellPrice,
    calculateTotalProfit
  }
}

// ============================================================================
// Composable：useSingleItemProfit（单个物品响应式利润计算）
// ============================================================================

export interface UseSingleItemProfitReturn {
  profit: ComputedRef<number>
  profitRate: ComputedRef<number>
  profitColor: ComputedRef<'success' | 'danger' | 'warning'>
  formattedProfitRate: ComputedRef<string>
  isProfitable: ComputedRef<boolean>
}

/**
 * 单个物品的响应式利润计算
 */
export function useSingleItemProfit(
  sellPrice: Ref<number>,
  costPrice: Ref<number>
): UseSingleItemProfitReturn {
  const profit = computed(() => calculateSimpleProfit(sellPrice.value, costPrice.value))

  const profitRate = computed(() => calculateProfitRate(profit.value, costPrice.value))

  const profitColor = computed<'success' | 'danger' | 'warning'>(() => {
    if (profit.value > 0) return 'success'
    if (profit.value < 0) return 'danger'
    return 'warning'
  })

  const formattedProfitRate = computed(() => {
    const rate = profitRate.value
    const sign = rate > 0 ? '+' : ''
    return `${sign}${rate.toFixed(2)}%`
  })

  const isProfitable = computed(() => profit.value > 0)

  return {
    profit,
    profitRate,
    profitColor,
    formattedProfitRate,
    isProfitable
  }
}

// ============================================================================
// Composable：useBatchProfit（批量物品响应式利润计算）
// ============================================================================

export interface PriceItem {
  sellPrice?: number
  marketPrice?: number
  costPrice?: number
  quantity?: number
}

export interface UseBatchProfitReturn {
  totalCost: ComputedRef<number>
  totalSellPrice: ComputedRef<number>
  totalProfit: ComputedRef<number>
  totalProfitRate: ComputedRef<number>
  averageProfitRate: ComputedRef<number>
  profitColor: ComputedRef<'success' | 'danger' | 'warning'>
  formattedTotalProfitRate: ComputedRef<string>
  itemCount: ComputedRef<number>
}

/**
 * 批量物品的响应式利润计算
 */
export function useBatchProfit(items: Ref<PriceItem[]>): UseBatchProfitReturn {
  const totalCost = computed(() => calculateTotalCost(items.value))

  const totalSellPrice = computed(() => calculateTotalSellPrice(items.value))

  const totalProfit = computed(() => calculateTotalProfit(items.value))

  const totalProfitRate = computed(() => {
    const cost = totalCost.value
    if (cost === 0) return 0
    return (totalProfit.value / cost) * 100
  })

  const averageProfitRate = computed(() => {
    const validItems = items.value.filter((item) => (item.costPrice || 0) > 0)
    if (validItems.length === 0) return 0

    const rates = validItems.map((item) => {
      const sellPrice = item.sellPrice || item.marketPrice || 0
      const costPrice = item.costPrice || 0
      const profit = sellPrice - costPrice
      return calculateProfitRate(profit, costPrice)
    })
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  })

  const profitColor = computed<'success' | 'danger' | 'warning'>(() => {
    if (totalProfit.value > 0) return 'success'
    if (totalProfit.value < 0) return 'danger'
    return 'warning'
  })

  const formattedTotalProfitRate = computed(() => {
    const rate = totalProfitRate.value
    const sign = rate > 0 ? '+' : ''
    return `${sign}${rate.toFixed(2)}%`
  })

  const itemCount = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.quantity || 1), 0)
  })

  return {
    totalCost,
    totalSellPrice,
    totalProfit,
    totalProfitRate,
    averageProfitRate,
    profitColor,
    formattedTotalProfitRate,
    itemCount
  }
}

// ============================================================================
// 类型导出
// ============================================================================

export type UseProfitCalculatorReturn = ReturnType<typeof useProfitCalculator>
