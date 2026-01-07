/**
 * 库存 Store
 *
 * 职责：只存储数据，不含业务逻辑
 * 所有逻辑处理已迁移到 composables:
 * - useInventoryLogic: 筛选、排序、分组、统计、选择
 * - useInventoryService: 数据加载、刷新、缓存
 * - useProfitCalculator: 利润计算
 * - useDataNormalizer: 数据标准化
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { usePlatformStore } from './platform'
import type { InventoryItem } from '@/types/inventory'

/**
 * 库存 Store
 */
export const useInventoryStore = defineStore('inventory', () => {
  const platformStore = usePlatformStore()

  // ============================================================================
  // State - 纯数据状态
  // ============================================================================

  /** 原始库存数据 */
  const rawItems = ref<InventoryItem[]>([])

  /** 总数量 */
  const total = ref(0)

  /** 当前页码 */
  const currentPage = ref(1)

  /** 每页数量 */
  const pageSize = ref(20)

  /** 加载状态 */
  const loading = ref(false)

  /** 刷新状态 */
  const refreshing = ref(false)

  /** 初始化状态 */
  const initialized = ref(false)

  /** 最后更新时间 */
  const lastUpdated = ref<number | null>(null)

  /** 错误信息 */
  const error = ref<string | null>(null)

  // ============================================================================
  // Actions - 简单数据操作
  // ============================================================================

  /**
   * 设置库存数据
   */
  function setItems(items: InventoryItem[]): void {
    rawItems.value = items
  }

  /**
   * 设置总数量
   */
  function setTotal(count: number): void {
    total.value = count
  }

  /**
   * 设置当前页码
   */
  function setCurrentPage(page: number): void {
    currentPage.value = page
  }

  /**
   * 设置每页数量
   */
  function setPageSize(size: number): void {
    pageSize.value = size
  }

  /**
   * 设置加载状态
   */
  function setLoading(state: boolean): void {
    loading.value = state
  }

  /**
   * 设置刷新状态
   */
  function setRefreshing(state: boolean): void {
    refreshing.value = state
  }

  /**
   * 设置初始化状态
   */
  function setInitialized(state: boolean): void {
    initialized.value = state
  }

  /**
   * 设置最后更新时间
   */
  function setLastUpdated(time: number | null): void {
    lastUpdated.value = time
  }

  /**
   * 设置错误信息
   */
  function setError(message: string | null): void {
    error.value = message
  }

  /**
   * 更新单个物品
   */
  function updateItem(itemId: string, updates: Partial<InventoryItem>): void {
    const item = rawItems.value.find((i) => i.id === itemId)
    if (item) {
      Object.assign(item, updates)
    }
  }

  /**
   * 批量更新物品
   */
  function updateItems(updates: Array<{ id: string; data: Partial<InventoryItem> }>): void {
    for (const { id, data } of updates) {
      updateItem(id, data)
    }
  }

  /**
   * 清除库存数据
   */
  function clear(): void {
    rawItems.value = []
    total.value = 0
    currentPage.value = 1
    error.value = null
    lastUpdated.value = null
    initialized.value = false
  }

  // ============================================================================
  // Watchers
  // ============================================================================

  // 监听平台切换，重置数据
  watch(
    () => platformStore.currentPlatform,
    () => {
      clear()
    }
  )

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    rawItems,
    total,
    currentPage,
    pageSize,
    loading,
    refreshing,
    initialized,
    lastUpdated,
    error,

    // Actions
    setItems,
    setTotal,
    setCurrentPage,
    setPageSize,
    setLoading,
    setRefreshing,
    setInitialized,
    setLastUpdated,
    setError,
    updateItem,
    updateItems,
    clear
  }
})

export type UseInventoryStoreReturn = ReturnType<typeof useInventoryStore>
