/**
 * 价格计算 Composable
 *
 * 将 price-calculator.service 的纯函数封装为响应式逻辑
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import {
  calculateProfit,
  calculateProfitRate,
  calculateTotalCost,
  calculateTotalSellPrice,
  calculateTotalProfit
} from '@/services/price-calculator.service'

/**
 * 单个物品的价格计算
 */
export interface UsePriceCalculatorReturn {
  /** 利润 */
  profit: ComputedRef<number>
  /** 利润率 */
  profitRate: ComputedRef<number>
  /** 利润颜色（用于 UI 显示） */
  profitColor: ComputedRef<'success' | 'danger' | 'warning'>
  /** 格式化的利润率 */
  formattedProfitRate: ComputedRef<string>
  /** 是否盈利 */
  isProfitable: ComputedRef<boolean>
}

/**
 * 单个物品的价格计算 Composable
 *
 * @param sellPrice 销售价格（响应式）
 * @param costPrice 成本价格（响应式）
 */
export function usePriceCalculator(
  sellPrice: Ref<number>,
  costPrice: Ref<number>
): UsePriceCalculatorReturn {
  const profit = computed(() => calculateProfit(sellPrice.value, costPrice.value))

  const profitRate = computed(() => calculateProfitRate(sellPrice.value, costPrice.value))

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

/**
 * 批量物品价格计算接口
 */
export interface PriceItem {
  sellPrice: number
  costPrice: number
  quantity?: number
}

/**
 * 批量价格计算返回值
 */
export interface UseBatchPriceCalculatorReturn {
  /** 总成本 */
  totalCost: ComputedRef<number>
  /** 总售价 */
  totalSellPrice: ComputedRef<number>
  /** 总利润 */
  totalProfit: ComputedRef<number>
  /** 总利润率 */
  totalProfitRate: ComputedRef<number>
  /** 平均利润率 */
  averageProfitRate: ComputedRef<number>
  /** 利润颜色 */
  profitColor: ComputedRef<'success' | 'danger' | 'warning'>
  /** 格式化的总利润率 */
  formattedTotalProfitRate: ComputedRef<string>
  /** 物品数量 */
  itemCount: ComputedRef<number>
}

/**
 * 批量物品价格计算 Composable
 *
 * @param items 物品列表（响应式）
 */
export function useBatchPriceCalculator(
  items: Ref<PriceItem[]>
): UseBatchPriceCalculatorReturn {
  const totalCost = computed(() => calculateTotalCost(items.value))

  const totalSellPrice = computed(() => calculateTotalSellPrice(items.value))

  const totalProfit = computed(() => calculateTotalProfit(items.value))

  const totalProfitRate = computed(() => {
    const cost = totalCost.value
    if (cost === 0) return 0
    return (totalProfit.value / cost) * 100
  })

  const averageProfitRate = computed(() => {
    const validItems = items.value.filter((item) => item.costPrice > 0)
    if (validItems.length === 0) return 0

    const rates = validItems.map((item) => calculateProfitRate(item.sellPrice, item.costPrice))
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

/**
 * 价格格式化工具
 */
export function useFormatPrice() {
  /**
   * 格式化价格（人民币）
   */
  const formatCNY = (price: number, decimals: number = 2): string => {
    return `¥${price.toFixed(decimals)}`
  }

  /**
   * 格式化价格（美元）
   */
  const formatUSD = (price: number, decimals: number = 2): string => {
    return `$${price.toFixed(decimals)}`
  }

  /**
   * 格式化利润（带正负号）
   */
  const formatProfit = (profit: number, decimals: number = 2): string => {
    const sign = profit > 0 ? '+' : ''
    return `${sign}¥${profit.toFixed(decimals)}`
  }

  /**
   * 格式化百分比
   */
  const formatPercent = (value: number, decimals: number = 2): string => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(decimals)}%`
  }

  return {
    formatCNY,
    formatUSD,
    formatProfit,
    formatPercent
  }
}
