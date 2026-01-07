/**
 * 库存管理 Composable
 *
 * 提供库存数据的响应式管理
 */

import { ref, computed, watch, type Ref } from 'vue'
import { PlatformType } from '@/config/platform.config'
import {
  getPlatformAdapter,
  type InventoryItem,
  type GetInventoryParams,
  type SellingItem
} from '@/api/modules/platform/adapters'
import { inventoryCache } from '@/utils/cache'
import { logger } from '../../../utils/logger'
/**
 * 库存 Composable 选项
 */
export interface UseInventoryOptions {
  /** 平台类型 */
  platform: PlatformType | Ref<PlatformType>
  /** 是否自动加载 */
  immediate?: boolean
  /** 是否使用缓存 */
  useCache?: boolean
  /** 缓存过期时间（毫秒） */
  cacheTime?: number
}

/**
 * 库存 Composable 返回值
 */
export interface UseInventoryReturn {
  /** 库存列表 */
  items: Ref<InventoryItem[]>
  /** 在售物品列表 */
  sellingItems: Ref<SellingItem[]>
  /** 总数量 */
  total: Ref<number>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 当前页码 */
  currentPage: Ref<number>
  /** 每页数量 */
  pageSize: Ref<number>
  /** 搜索关键词 */
  searchQuery: Ref<string>
  /** 是否只显示可交易物品 */
  tradableOnly: Ref<boolean>
  /** 加载库存 */
  loadInventory: (params?: GetInventoryParams) => Promise<void>
  /** 加载在售物品 */
  loadSellingItems: (params?: GetInventoryParams) => Promise<void>
  /** 刷新库存（强制从平台获取） */
  refresh: () => Promise<void>
  /** 清除缓存 */
  clearCache: () => void
  /** 根据 ID 获取物品 */
  getItemById: (id: string) => InventoryItem | undefined
  /** 计算统计数据 */
  stats: {
    totalValue: Ref<number>
    totalCost: Ref<number>
    totalProfit: Ref<number>
    tradableCount: Ref<number>
  }
}

/**
 * 库存管理 Composable
 */
export function useInventory(options: UseInventoryOptions): UseInventoryReturn {
  const { platform, immediate = false, useCache = true } = options

  // 响应式平台
  const currentPlatform = computed(() => {
    return typeof platform === 'object' ? platform.value : platform
  })

  // 状态
  const items = ref<InventoryItem[]>([])
  const sellingItems = ref<SellingItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // 分页和过滤
  const currentPage = ref(1)
  const pageSize = ref(20)
  const searchQuery = ref('')
  const tradableOnly = ref(false)

  // 获取适配器
  const getAdapter = () => getPlatformAdapter(currentPlatform.value)

  // 生成缓存键
  const getCacheKey = (type: string, params?: GetInventoryParams) => {
    const base = `${currentPlatform.value}:${type}`
    if (!params) return base
    return `${base}:${JSON.stringify(params)}`
  }

  /**
   * 加载库存
   */
  const loadInventory = async (params?: GetInventoryParams): Promise<void> => {
    const finalParams: GetInventoryParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value || undefined,
      tradableOnly: tradableOnly.value || undefined,
      ...params
    }

    const cacheKey = getCacheKey('inventory', finalParams)

    // 尝试从缓存获取
    if (useCache) {
      const cached = inventoryCache.get(cacheKey) as { items: InventoryItem[]; total: number } | null
      if (cached) {
        items.value = cached.items
        total.value = cached.total
        return
      }
    }

    loading.value = true
    error.value = null

    try {
      const adapter = getAdapter()
      const response = await adapter.getInventory(finalParams)

      items.value = response.items
      total.value = response.total

      // 缓存结果
      if (useCache) {
        inventoryCache.set(cacheKey, {
          items: response.items,
          total: response.total
        })
      }
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('加载库存失败')
      logger.error('[useInventory] Failed to load inventory:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载在售物品
   */
  const loadSellingItems = async (params?: GetInventoryParams): Promise<void> => {
    const finalParams: GetInventoryParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...params
    }

    loading.value = true
    error.value = null

    try {
      const adapter = getAdapter()
      const response = await adapter.getSellingItems(finalParams)
      sellingItems.value = response.items
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('加载在售物品失败')
      logger.error('[useInventory] Failed to load selling items:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新库存
   */
  const refresh = async (): Promise<void> => {
    clearCache()

    loading.value = true
    error.value = null

    try {
      const adapter = getAdapter()
      await adapter.refreshInventory()
      await loadInventory()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('刷新库存失败')
      logger.error('[useInventory] Failed to refresh inventory:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除缓存
   */
  const clearCache = (): void => {
    // 清除当前平台的所有缓存
    const stats = inventoryCache.getStats()
    stats.keys
      .filter((key) => key.startsWith(currentPlatform.value))
      .forEach((key) => inventoryCache.invalidate(key))
  }

  /**
   * 根据 ID 获取物品
   */
  const getItemById = (id: string): InventoryItem | undefined => {
    return items.value.find((item) => item.id === id || item.assetId === id)
  }

  // 计算统计数据
  const totalValue = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.marketPrice || 0), 0)
  })

  const totalCost = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.costPrice || 0), 0)
  })

  const totalProfit = computed(() => {
    return totalValue.value - totalCost.value
  })

  const tradableCount = computed(() => {
    return items.value.filter((item) => item.tradable).length
  })

  const stats = {
    totalValue,
    totalCost,
    totalProfit,
    tradableCount
  }

  // 监听平台变化，自动重新加载
  watch(
    currentPlatform,
    () => {
      if (immediate) {
        loadInventory()
      }
    },
    { immediate }
  )

  // 监听分页和过滤条件变化
  watch([currentPage, pageSize, searchQuery, tradableOnly], () => {
    loadInventory()
  })

  return {
    items,
    sellingItems,
    total,
    loading,
    error,
    currentPage,
    pageSize,
    searchQuery,
    tradableOnly,
    loadInventory,
    loadSellingItems,
    refresh,
    clearCache,
    getItemById,
    stats
  }
}
