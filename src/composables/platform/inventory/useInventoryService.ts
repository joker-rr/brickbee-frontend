/**
 * 库存服务 Composable
 *
 * 处理库存数据的加载、刷新、缓存
 * 连接 Adapter 和 Store
 */

import { ref, computed } from 'vue'
import { PlatformType } from '@/config/platform.config'
import { adapter } from '@/api/modules/platform/adapters'
import { useInventoryStore } from '@/stores/modules/inventory'
import { usePlatformStore } from '@/stores/modules/platform'
import { useDataNormalizer } from '../useDataNormalizer'
import { inventoryHybridCache } from '@/utils/cache/hybrid-cache'
import { logger } from '@/utils/logger'
import { toast } from '@/utils/toast'
import type { InventoryItem } from '@/types/inventory'
import type { GetInventoryParams } from '@/api/modules/platform/adapters/types/inventory.types'
import { executionSessionManager } from '@/composables/platform/platform-access'
// ============================================================================
// 类型定义
// ============================================================================

export interface FetchInventoryOptions {
  /** 是否强制刷新（跳过缓存） */
  force?: boolean
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
  /** 搜索关键词 */
  search?: string
  /** 是否只显示可交易物品 */
  tradableOnly?: boolean
  /** 排序字段 */
  sortBy?: 'name' | 'price' | 'time'
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

export interface UseInventoryServiceReturn {
  /** 加载库存数据 */
  fetchInventory: (options?: FetchInventoryOptions) => Promise<void>
  /** 刷新库存（强制重新加载） */
  refreshInventory: () => Promise<void>
  /** 清除缓存 */
  clearCache: () => void
  /** 是否有缓存 */
  hasCachedData: () => boolean
}

// ============================================================================
// 缓存管理
// ============================================================================

/**
 * 生成缓存键
 */
function getCacheKey(platform: PlatformType, page: number, pageSize: number): string {
  return `${platform}_${page}_${pageSize}`
}

// ============================================================================
// Composable
// ============================================================================

/**
 * 库存服务 Composable
 *
 * 提供库存数据的加载和管理功能
 */
export function useInventoryService() {
  const inventoryStore = useInventoryStore()
  const platformStore = usePlatformStore()

  /**
   * 获取当前平台
   */
  const currentPlatform = computed(() => platformStore.currentPlatform)

  /**
   * 获取数据标准化器
   */
  const { normalizeInventoryItems } = useDataNormalizer(() => currentPlatform.value)

  /**
   * 加载库存数据
   */
  const fetchInventory = async (options: FetchInventoryOptions = {}): Promise<void> => {
    const {
      force = false,
      page = inventoryStore.currentPage,
      pageSize = inventoryStore.pageSize,
      search,
      tradableOnly,
      sortBy = 'name',
      sortOrder = 'asc'
    } = options

    // 防止重复加载
    if (inventoryStore.loading) return

    const platform = currentPlatform.value
    const cacheKey = getCacheKey(platform, page, pageSize)

    // 检查缓存
    if (!force) {
      const cached = inventoryHybridCache.get(cacheKey) as {
        items: InventoryItem[]
        total: number
      } | null

      if (cached) {
        inventoryStore.setItems(cached.items)
        inventoryStore.setTotal(cached.total)
        logger.log(`[InventoryService] 从缓存加载库存: ${platform}`)
        return
      }
    }

    inventoryStore.setLoading(true)
    inventoryStore.setError(null)

    // 3. 获取会话并更新 Store
    const session = executionSessionManager.getSession(platform)

    try {

      // 调用 API
      const response = await adapter.getInventory({
        page,
        pageSize,
        search,
        tradableOnly,
        sortBy,
        sortOrder,
        executionToken: session.executionToken,
        platform,
      } as GetInventoryParams)

      // 标准化数据
      const normalizedItems = normalizeInventoryItems(
        response.items as unknown as Record<string, unknown>[]
      )

      // 更新 Store
      inventoryStore.setItems(normalizedItems)
      inventoryStore.setTotal(response.total)
      inventoryStore.setInitialized(true)
      inventoryStore.setLastUpdated(Date.now())

      // 写入缓存
      inventoryHybridCache.set(cacheKey, {
        items: normalizedItems,
        total: response.total
      })

      // 同步到 platformStore
      platformStore.setInventory(platform, normalizedItems)

      logger.log(`[InventoryService] 库存加载成功: ${platform}, 数量: ${normalizedItems.length}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载库存失败'
      inventoryStore.setError(message)
      logger.error('[InventoryService] 加载库存失败:', err)
      toast.error(message)
    } finally {
      inventoryStore.setLoading(false)
    }
  }

  /**
   * 刷新库存（强制重新加载）
   */
  const refreshInventory = async (): Promise<void> => {
    if (inventoryStore.refreshing) return

    inventoryStore.setRefreshing(true)

    try {
      const platform = currentPlatform.value
      const cacheKey = getCacheKey(platform, inventoryStore.currentPage, inventoryStore.pageSize)

      // 清除当前平台缓存
      inventoryHybridCache.delete(cacheKey)

      // 调用平台刷新接口
      if (adapter?.refreshInventory) {
        await adapter.refreshInventory()
      }

      // 重新加载数据
      await fetchInventory({ force: true })

      toast.success('库存刷新成功')
    } catch (err) {
      const message = err instanceof Error ? err.message : '刷新失败'
      logger.error('[InventoryService] 刷新库存失败:', err)
      toast.error(message)
    } finally {
      inventoryStore.setRefreshing(false)
    }
  }

  /**
   * 清除缓存
   */
  const clearCache = (): void => {
    inventoryHybridCache.clear()
    inventoryStore.setLastUpdated(null)
    logger.log('[InventoryService] 缓存已清除')
  }

  /**
   * 检查是否有缓存
   */
  const hasCachedData = (): boolean => {
    const platform = currentPlatform.value
    const cacheKey = getCacheKey(platform, inventoryStore.currentPage, inventoryStore.pageSize)
    return inventoryHybridCache.has(cacheKey)
  }

  return {
    fetchInventory,
    refreshInventory,
    clearCache,
    hasCachedData
  }
}

