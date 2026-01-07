/**
 * 成本价管理 Composable
 *
 * 管理物品成本价的设置、持久化和计算
 */

import { ref, computed, watch } from 'vue'
import { PlatformType } from '@/config/platform.config'
import type { InventoryItem, GroupStats, CostPriceRecord } from '@/types/inventory'
import { storage } from '@/utils/cache/storage'
import { usePlatformAdapter } from './usePlatformAdapter'

const STORAGE_KEY_PREFIX = 'cost_prices_'

/**
 * 成本价管理 Composable
 */
export function useCostPrice(platform: () => PlatformType) {
  const { calculateProfit, exchangeRate, supportsExchangeRate } = usePlatformAdapter()

  // 成本价缓存
  const costPrices = ref<Record<string, number>>({})

  // 是否正在编辑
  const editingId = ref<string | null>(null)

  // 编辑中的值
  const editValue = ref<string>('')

  // 存储键
  const storageKey = computed(() => `${STORAGE_KEY_PREFIX}${platform()}`)

  /**
   * 加载成本价数据
   */
  function loadCostPrices(): void {
    const saved = storage.get(storageKey.value) as CostPriceRecord | null
    if (saved?.prices) {
      costPrices.value = saved.prices
    }
  }

  /**
   * 保存成本价数据
   */
  function saveCostPrices(): void {
    const record: CostPriceRecord = {
      platform: platform(),
      prices: costPrices.value,
      updatedAt: new Date().toISOString()
    }
    storage.set(storageKey.value, record)
  }

  /**
   * 获取物品成本价
   */
  function getCostPrice(itemId: string): number | undefined {
    return costPrices.value[itemId]
  }

  /**
   * 设置单个物品成本价
   */
  function setCostPrice(itemId: string, price: number): void {
    if (price > 0) {
      costPrices.value[itemId] = price
    } else {
      delete costPrices.value[itemId]
    }
    saveCostPrices()
  }

  /**
   * 批量设置成本价（同一分组）
   */
  function setGroupCostPrices(items: InventoryItem[], price: number): void {
    items.forEach(item => {
      if (price > 0) {
        costPrices.value[item.id] = price
        item.costPrice = price
      } else {
        delete costPrices.value[item.id]
        item.costPrice = undefined
      }
    })
    saveCostPrices()
  }

  /**
   * 清除物品成本价
   */
  function clearCostPrice(itemId: string): void {
    delete costPrices.value[itemId]
    saveCostPrices()
  }

  /**
   * 清除所有成本价
   */
  function clearAllCostPrices(): void {
    costPrices.value = {}
    saveCostPrices()
  }

  /**
   * 应用成本价到物品列表
   */
  function applyCostPrices(items: InventoryItem[]): InventoryItem[] {
    return items.map(item => ({
      ...item,
      costPrice: costPrices.value[item.id] ?? item.costPrice
    }))
  }

  /**
   * 计算分组统计
   */
  function calculateGroupStats(items: InventoryItem[]): GroupStats {
    const validPrices = items
      .map(item => costPrices.value[item.id])
      .filter((price): price is number => typeof price === 'number' && price > 0)

    if (validPrices.length === 0) {
      return {
        averageCost: null,
        count: 0,
        hasValidPrices: false
      }
    }

    const total = validPrices.reduce((sum, p) => sum + p, 0)

    return {
      averageCost: Number((total / validPrices.length).toFixed(2)),
      count: validPrices.length,
      hasValidPrices: true
    }
  }

  /**
   * 计算物品利润
   */
  function getItemProfit(item: InventoryItem): number | null {
    const cost = costPrices.value[item.id] ?? item.costPrice
    if (!item.marketPrice || !cost) {
      return null
    }

    return calculateProfit(
      item.marketPrice,
      cost,
      supportsExchangeRate.value ? exchangeRate.value : undefined
    )
  }

  /**
   * 计算分组总利润
   */
  function getGroupTotalProfit(items: InventoryItem[]): number | null {
    let totalProfit = 0
    let hasProfit = false

    items.forEach(item => {
      const profit = getItemProfit(item)
      if (profit !== null) {
        totalProfit += profit
        hasProfit = true
      }
    })

    return hasProfit ? Number(totalProfit.toFixed(2)) : null
  }

  /**
   * 开始编辑
   */
  function startEdit(itemId: string, currentValue?: number): void {
    editingId.value = itemId
    editValue.value = currentValue ? String(currentValue) : ''
  }

  /**
   * 取消编辑
   */
  function cancelEdit(): void {
    editingId.value = null
    editValue.value = ''
  }

  /**
   * 确认编辑
   */
  function confirmEdit(): void {
    if (editingId.value) {
      const price = parseFloat(editValue.value)
      if (!isNaN(price) && price >= 0) {
        setCostPrice(editingId.value, price)
      }
    }
    cancelEdit()
  }

  /**
   * 检查是否正在编辑
   */
  function isEditing(itemId: string): boolean {
    return editingId.value === itemId
  }

  /**
   * 格式化成本价显示
   */
  function formatCostPrice(price: number | undefined | null): string {
    if (price === undefined || price === null) {
      return '未设置'
    }
    return `¥${price.toFixed(2)}`
  }

  // 监听平台变化，重新加载成本价
  watch(
    () => platform(),
    () => {
      loadCostPrices()
    },
    { immediate: true }
  )

  return {
    // 状态
    costPrices,
    editingId,
    editValue,

    // 成本价操作
    getCostPrice,
    setCostPrice,
    setGroupCostPrices,
    clearCostPrice,
    clearAllCostPrices,
    applyCostPrices,
    loadCostPrices,

    // 统计计算
    calculateGroupStats,
    getItemProfit,
    getGroupTotalProfit,

    // 编辑操作
    startEdit,
    cancelEdit,
    confirmEdit,
    isEditing,

    // 格式化
    formatCostPrice
  }
}

export type UseCostPriceReturn = ReturnType<typeof useCostPrice>
