/**
 * 平台适配器 Composable
 *
 * 提供平台适配器选择和管理功能
 * 使用新的 composables 处理业务逻辑：
 * - useProfitCalculator: 利润计算
 * - usePriceFormatter: 价格格式化
 */

import { computed, ref, watch } from 'vue'
import { PlatformType } from '@/config/platform.config'
import { getPlatformAdapter } from '@/api/modules/platform/adapters'
import type { BasePlatformAdapter } from '@/api/modules/platform/adapters'
import { usePlatformStore } from '@/stores/modules/platform'
import { useProfitCalculator, calculatePlatformProfit } from './useProfitCalculator'
import { usePriceFormatter } from './usePriceFormatter'

/**
 * 平台适配器 Composable
 */
export function usePlatformAdapter() {
  const platformStore = usePlatformStore()

  // 当前平台适配器
  const adapter = computed<BasePlatformAdapter>(() => {
    return getPlatformAdapter(platformStore.currentPlatform) as BasePlatformAdapter
  })

  // 当前平台类型
  const currentPlatform = computed(() => platformStore.currentPlatform)

  // 当前平台名称
  const platformName = computed(() => adapter.value.platformName)

  // 货币类型
  const currency = computed(() => adapter.value.currency)

  // 是否支持汇率
  const supportsExchangeRate = computed(() => adapter.value.supportsExchangeRate)

  // 默认汇率
  const defaultExchangeRate = computed(() => adapter.value.defaultExchangeRate || 7)

  // 当前汇率（可由外部设置）
  const exchangeRate = ref(defaultExchangeRate.value)

  // 使用 composables
  const { getDefaultExchangeRate, needsExchangeRate } = useProfitCalculator(() => currentPlatform.value)
  const { formatPrice: formatPriceInternal, getCurrencySymbol: getSymbol } = usePriceFormatter(() => currentPlatform.value)

  // 监听平台变化，重置汇率
  watch(
    () => platformStore.currentPlatform,
    () => {
      if (supportsExchangeRate.value) {
        exchangeRate.value = getDefaultExchangeRate()
      }
    }
  )

  /**
   * 获取指定平台的适配器
   */
  function getAdapter(platform: PlatformType): BasePlatformAdapter {
    return getPlatformAdapter(platform) as BasePlatformAdapter
  }

  /**
   * 切换平台
   */
  function switchPlatform(platform: PlatformType): void {
    platformStore.switchPlatform(platform)
  }

  /**
   * 格式化价格
   */
  function formatPrice(price: number): string {
    return formatPriceInternal(price)
  }

  /**
   * 计算利润
   */
  function calculateProfit(
    marketPrice: number,
    costPrice: number,
    rate?: number
  ): number {
    const effectiveRate = rate || (supportsExchangeRate.value ? exchangeRate.value : undefined)
    return calculatePlatformProfit(currentPlatform.value, marketPrice, costPrice, effectiveRate)
  }

  /**
   * 获取货币符号
   */
  function getCurrencySymbol(): string {
    return getSymbol()
  }

  /**
   * 获取货币类型
   */
  function getCurrencyType(): 'USD' | 'CNY' {
    return currency.value
  }

  /**
   * 设置汇率
   */
  function setExchangeRate(rate: number): void {
    if (supportsExchangeRate.value) {
      exchangeRate.value = rate
    }
  }

  return {
    // 适配器
    adapter,
    getAdapter,

    // 平台信息
    currentPlatform,
    platformName,
    currency,
    supportsExchangeRate,

    // 汇率相关
    exchangeRate,
    defaultExchangeRate,
    setExchangeRate,
    needsExchangeRate,

    // 方法
    switchPlatform,
    formatPrice,
    calculateProfit,
    getCurrencySymbol,
    getCurrencyType
  }
}

export type UsePlatformAdapterReturn = ReturnType<typeof usePlatformAdapter>
