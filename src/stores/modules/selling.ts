/**
 * 在售 Store
 *
 * 管理在售物品数据、上架下架操作、缓存和筛选
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { usePlatformStore } from './platform'
import { getPlatformAdapter } from '@/api/modules/platform/adapters'
import { sellingHybridCache } from '@/utils/cache/hybrid-cache'
import { logger } from '@/utils/logger'
import { toast } from '@/utils/toast'
import type {
  SellingItem,
  GroupedSellingItems,
  SellingStats,
  SellingFilter,
  SellingSort,
  SellingStatus,
  ListItemParams,
  DelistItemParams,
  ChangePriceParams,
  BatchListParams,
  BatchDelistParams,
  BatchOperationResult,
  SellHistoryItem,
  SellHistoryStats,
  SellHistoryFilter
} from '@/types/selling'
import type { DisplayMode } from '@/types/inventory'
import type { PlatformType } from '@/config/platform.config'

/**
 * 缓存键生成
 */
function getCacheKey(platform: PlatformType, page: number, pageSize: number): string {
  return `${platform}_selling_${page}_${pageSize}`
}

/**
 * 在售 Store
 */
export const useSellingStore = defineStore('selling', () => {
  const platformStore = usePlatformStore()

  // ============================================================================
  // State
  // ============================================================================

  /** 原始在售数据 */
  const rawItems = ref<SellingItem[]>([])

  /** 当前页码 */
  const currentPage = ref(1)

  /** 每页数量 */
  const pageSize = ref(20)

  /** 总数量 */
  const total = ref(0)

  /** 加载状态 */
  const loading = ref(false)

  /** 刷新状态 */
  const refreshing = ref(false)

  /** 初始化状态 */
  const initialized = ref(false)

  /** 展示模式 */
  const displayMode = ref<DisplayMode>('expanded')

  /** 筛选条件 */
  const filter = ref<SellingFilter>({})

  /** 排序配置 */
  const sort = ref<SellingSort>({
    field: 'listedAt',
    order: 'desc'
  })

  /** 展开的分组 */
  const expandedGroups = ref<Set<string>>(new Set())

  /** 选中的物品ID */
  const selectedIds = ref<Set<string>>(new Set())

  /** 最后更新时间 */
  const lastUpdated = ref<number | null>(null)

  /** 错误信息 */
  const error = ref<string | null>(null)

  /** 操作中的物品ID（上架/下架/改价） */
  const operatingIds = ref<Set<string>>(new Set())

  // 销售历史相关
  /** 销售历史数据 */
  const sellHistory = ref<SellHistoryItem[]>([])

  /** 销售历史筛选 */
  const historyFilter = ref<SellHistoryFilter>({
    timeRange: '7days'
  })

  /** 销售历史加载状态 */
  const historyLoading = ref(false)

  // ============================================================================
  // Computed
  // ============================================================================

  /** 当前平台 */
  const currentPlatform = computed(() => platformStore.currentPlatform)

  /** 当前平台适配器 */
  const adapter = computed(() => getPlatformAdapter(currentPlatform.value))

  /** 筛选后的物品 */
  const filteredItems = computed<SellingItem[]>(() => {
    let result = [...rawItems.value]

    // 搜索过滤
    if (filter.value.search) {
      const keyword = filter.value.search.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.marketHashName.toLowerCase().includes(keyword)
      )
    }

    // 状态过滤
    if (filter.value.status?.length) {
      result = result.filter(item =>
        filter.value.status!.includes(item.status)
      )
    }

    // 价格范围过滤
    if (filter.value.priceRange) {
      const { min, max } = filter.value.priceRange
      result = result.filter(item => {
        const price = item.listPrice || 0
        if (min !== undefined && price < min) return false
        if (max !== undefined && price > max) return false
        return true
      })
    }

    return result
  })

  /** 排序后的物品 */
  const sortedItems = computed<SellingItem[]>(() => {
    const items = [...filteredItems.value]
    const { field, order } = sort.value
    const multiplier = order === 'asc' ? 1 : -1

    items.sort((a, b) => {
      let valueA: number | string = 0
      let valueB: number | string = 0

      switch (field) {
        case 'name':
          valueA = a.name
          valueB = b.name
          return multiplier * valueA.localeCompare(valueB)
        case 'listPrice':
          valueA = a.listPrice || 0
          valueB = b.listPrice || 0
          break
        case 'listedAt':
          valueA = new Date(a.listedAt).getTime()
          valueB = new Date(b.listedAt).getTime()
          break
        case 'status':
          valueA = a.status
          valueB = b.status
          return multiplier * valueA.localeCompare(valueB)
        default:
          return 0
      }

      return multiplier * (valueA - valueB)
    })

    return items
  })

  /** 分组物品 */
  const groupedItems = computed<GroupedSellingItems>(() => {
    const groups: GroupedSellingItems = {}

    for (const item of sortedItems.value) {
      const key = item.marketHashName
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
    }

    return groups
  })

  /** 展示用物品列表 */
  const displayItems = computed<SellingItem[]>(() => {
    if (displayMode.value === 'expanded') {
      return sortedItems.value
    }

    // 分组模式：只返回每组第一个物品（作为代表）
    const representatives: SellingItem[] = []
    for (const [, items] of Object.entries(groupedItems.value)) {
      if (items.length > 0) {
        representatives.push(items[0])
      }
    }

    return representatives
  })

  /** 物品统计 */
  const stats = computed<SellingStats>(() => {
    let totalValue = 0
    let activeCount = 0
    let pendingCount = 0
    let soldCount = 0

    for (const item of rawItems.value) {
      totalValue += item.listPrice || 0

      switch (item.status) {
        case 'active':
          activeCount++
          break
        case 'pending':
          pendingCount++
          break
        case 'sold':
          soldCount++
          break
      }
    }

    return {
      totalCount: rawItems.value.length,
      totalValue: Number(totalValue.toFixed(2)),
      activeCount,
      pendingCount,
      soldCount
    }
  })

  /** 销售历史统计 */
  const historyStats = computed<SellHistoryStats>(() => {
    let totalSales = 0
    let totalProfit = 0
    let profitRateSum = 0
    let profitRateCount = 0

    for (const item of sellHistory.value) {
      totalSales += item.sellPrice || 0

      if (item.profit !== undefined) {
        totalProfit += item.profit
      }

      if (item.profitRate !== undefined) {
        profitRateSum += item.profitRate
        profitRateCount++
      }
    }

    return {
      totalSales: Number(totalSales.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      averageProfitRate: profitRateCount > 0
        ? Number((profitRateSum / profitRateCount).toFixed(2))
        : 0,
      soldCount: sellHistory.value.length
    }
  })

  /** 是否批量模式 */
  const isBatchMode = computed(() => selectedIds.value.size > 0)

  /** 选中的物品 */
  const selectedItems = computed<SellingItem[]>(() => {
    return rawItems.value.filter(item => selectedIds.value.has(item.id))
  })

  /** 是否有缓存 */
  const hasCachedData = computed(() => {
    const cacheKey = getCacheKey(currentPlatform.value, currentPage.value, pageSize.value)
    return sellingHybridCache.has(cacheKey)
  })

  /** 缓存是否过期 */
  const isCacheExpired = computed(() => {
    if (!lastUpdated.value) return true
    const CACHE_TTL = 10 * 60 * 1000 // 10分钟
    return Date.now() - lastUpdated.value > CACHE_TTL
  })

  // ============================================================================
  // Actions - 数据加载
  // ============================================================================

  /**
   * 加载在售数据
   */
  async function fetchSellingItems(force = false): Promise<void> {
    if (loading.value) return

    const platform = currentPlatform.value
    const cacheKey = getCacheKey(platform, currentPage.value, pageSize.value)

    // 检查缓存
    if (!force) {
      const cached = sellingHybridCache.get(cacheKey) as { items: SellingItem[]; total: number } | null
      if (cached) {
        rawItems.value = cached.items
        total.value = cached.total
        logger.log(`[SellingStore] 从缓存加载在售: ${platform}`)
        return
      }
    }

    loading.value = true
    error.value = null

    try {
      const platformAdapter = getPlatformAdapter(platform)
      if (!platformAdapter) {
        throw new Error(`未找到平台适配器: ${platform}`)
      }

      const response = await platformAdapter.getSellingItems({
        page: currentPage.value,
        pageSize: pageSize.value
      })

      rawItems.value = response.items
      total.value = response.total
      lastUpdated.value = Date.now()
      initialized.value = true

      // 写入缓存
      sellingHybridCache.set(cacheKey, {
        items: response.items,
        total: response.total
      })

      // 同步到 platformStore
      platformStore.setSelling(platform, response.items)

      logger.log(`[SellingStore] 在售加载成功: ${platform}, 数量: ${response.items.length}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载在售物品失败'
      error.value = message
      logger.error('[SellingStore] 加载在售失败:', err)
      toast.error(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新在售（强制重新加载）
   */
  async function refreshSellingItems(): Promise<void> {
    if (refreshing.value) return

    refreshing.value = true

    try {
      // 清除当前平台缓存
      const platform = currentPlatform.value
      const cacheKey = getCacheKey(platform, currentPage.value, pageSize.value)
      sellingHybridCache.delete(cacheKey)

      // 重新加载
      await fetchSellingItems(true)

      toast.success('在售列表刷新成功')
    } catch (err) {
      const message = err instanceof Error ? err.message : '刷新失败'
      logger.error('[SellingStore] 刷新在售失败:', err)
      toast.error(message)
    } finally {
      refreshing.value = false
    }
  }

  /**
   * 加载销售历史
   */
  async function fetchSellHistory(): Promise<void> {
    if (historyLoading.value) return

    historyLoading.value = true

    try {
      const platformAdapter = getPlatformAdapter(currentPlatform.value)
      if (!platformAdapter?.getSellHistory) {
        throw new Error('平台不支持销售历史')
      }

      const response = await platformAdapter.getSellHistory({
        page: 1,
        pageSize: 100,
        startDate: historyFilter.value.startDate,
        endDate: historyFilter.value.endDate
      })

      sellHistory.value = response.items

      // 同步到 platformStore
      platformStore.setSellHistory(currentPlatform.value, response.items)

      logger.log(`[SellingStore] 销售历史加载成功, 数量: ${response.items.length}`)
    } catch (err) {
      logger.error('[SellingStore] 加载销售历史失败:', err)
      toast.error('加载销售历史失败')
    } finally {
      historyLoading.value = false
    }
  }

  // ============================================================================
  // Actions - 上架/下架/改价
  // ============================================================================

  /**
   * 上架物品
   */
  async function listItem(params: ListItemParams): Promise<boolean> {
    const { assetId } = params

    if (operatingIds.value.has(assetId)) {
      toast.warning('该物品正在操作中')
      return false
    }

    operatingIds.value.add(assetId)

    try {
      const platformAdapter = getPlatformAdapter(currentPlatform.value)
      if (!platformAdapter) {
        throw new Error('未找到平台适配器')
      }

      const result = await platformAdapter.listItem(params)

      if (result.success) {
        toast.success('上架成功')
        // 刷新列表
        await fetchSellingItems(true)
        return true
      } else {
        toast.error(result.message || '上架失败')
        return false
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '上架失败'
      logger.error('[SellingStore] 上架失败:', err)
      toast.error(message)
      return false
    } finally {
      operatingIds.value.delete(assetId)
    }
  }

  /**
   * 下架物品
   */
  async function delistItem(params: DelistItemParams): Promise<boolean> {
    const { assetId } = params

    if (operatingIds.value.has(assetId)) {
      toast.warning('该物品正在操作中')
      return false
    }

    operatingIds.value.add(assetId)

    try {
      const platformAdapter = getPlatformAdapter(currentPlatform.value)
      if (!platformAdapter) {
        throw new Error('未找到平台适配器')
      }

      const result = await platformAdapter.delistItem(params)

      if (result.success) {
        toast.success('下架成功')
        // 从列表中移除
        rawItems.value = rawItems.value.filter(item => item.assetId !== assetId)
        // 失效缓存
        invalidateCache()
        return true
      } else {
        toast.error(result.message || '下架失败')
        return false
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '下架失败'
      logger.error('[SellingStore] 下架失败:', err)
      toast.error(message)
      return false
    } finally {
      operatingIds.value.delete(assetId)
    }
  }

  /**
   * 改价
   */
  async function changePrice(params: ChangePriceParams): Promise<boolean> {
    const { assetId, newPrice } = params

    if (operatingIds.value.has(assetId)) {
      toast.warning('该物品正在操作中')
      return false
    }

    operatingIds.value.add(assetId)

    try {
      const platformAdapter = getPlatformAdapter(currentPlatform.value)
      if (!platformAdapter?.changePrice) {
        throw new Error('平台不支持改价')
      }

      const result = await platformAdapter.changePrice(params)

      if (result.success) {
        toast.success('改价成功')
        // 更新本地数据
        const item = rawItems.value.find(i => i.assetId === assetId)
        if (item) {
          item.listPrice = newPrice
        }
        return true
      } else {
        toast.error(result.message || '改价失败')
        return false
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '改价失败'
      logger.error('[SellingStore] 改价失败:', err)
      toast.error(message)
      return false
    } finally {
      operatingIds.value.delete(assetId)
    }
  }

  /**
   * 批量上架
   */
  async function batchList(params: BatchListParams): Promise<BatchOperationResult> {
    const platformAdapter = getPlatformAdapter(currentPlatform.value)
    if (!platformAdapter?.batchListItems) {
      return {
        success: false,
        successCount: 0,
        failedCount: params.items.length,
        errors: [{ itemId: '', error: '平台不支持批量上架' }]
      }
    }

    try {
      const result = await platformAdapter.batchListItems(params.items)

      if (result.successCount > 0) {
        toast.success(`成功上架 ${result.successCount} 件物品`)
        await fetchSellingItems(true)
      }

      if (result.failedCount > 0) {
        toast.warning(`${result.failedCount} 件物品上架失败`)
      }

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量上架失败'
      logger.error('[SellingStore] 批量上架失败:', err)
      toast.error(message)
      return {
        success: false,
        successCount: 0,
        failedCount: params.items.length,
        errors: [{ itemId: '', error: message }]
      }
    }
  }

  /**
   * 批量下架
   */
  async function batchDelist(params: BatchDelistParams): Promise<BatchOperationResult> {
    const platformAdapter = getPlatformAdapter(currentPlatform.value)
    if (!platformAdapter?.batchDelistItems) {
      return {
        success: false,
        successCount: 0,
        failedCount: params.assetIds.length,
        errors: [{ itemId: '', error: '平台不支持批量下架' }]
      }
    }

    try {
      const result = await platformAdapter.batchDelistItems(params.assetIds)

      if (result.successCount > 0) {
        toast.success(`成功下架 ${result.successCount} 件物品`)
        // 从列表中移除成功下架的物品
        rawItems.value = rawItems.value.filter(
          item => !params.assetIds.includes(item.assetId) || result.errors.some(e => e.itemId === item.assetId)
        )
        invalidateCache()
      }

      if (result.failedCount > 0) {
        toast.warning(`${result.failedCount} 件物品下架失败`)
      }

      clearSelection()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量下架失败'
      logger.error('[SellingStore] 批量下架失败:', err)
      toast.error(message)
      return {
        success: false,
        successCount: 0,
        failedCount: params.assetIds.length,
        errors: [{ itemId: '', error: message }]
      }
    }
  }

  // ============================================================================
  // Actions - 分页和筛选
  // ============================================================================

  /**
   * 切换页码
   */
  async function changePage(page: number): Promise<void> {
    currentPage.value = page
    await fetchSellingItems()
  }

  /**
   * 切换每页数量
   */
  async function changePageSize(size: number): Promise<void> {
    pageSize.value = size
    currentPage.value = 1
    await fetchSellingItems()
  }

  /**
   * 设置筛选条件
   */
  function setFilter(newFilter: SellingFilter): void {
    filter.value = { ...filter.value, ...newFilter }
  }

  /**
   * 清除筛选条件
   */
  function clearFilter(): void {
    filter.value = {}
  }

  /**
   * 设置排序
   */
  function setSort(newSort: SellingSort): void {
    sort.value = newSort
  }

  /**
   * 设置销售历史筛选
   */
  function setHistoryFilter(newFilter: SellHistoryFilter): void {
    historyFilter.value = { ...historyFilter.value, ...newFilter }
  }

  // ============================================================================
  // Actions - 展示模式和选择
  // ============================================================================

  /**
   * 切换展示模式
   */
  function toggleDisplayMode(): void {
    displayMode.value = displayMode.value === 'expanded' ? 'grouped' : 'expanded'
  }

  /**
   * 设置展示模式
   */
  function setDisplayMode(mode: DisplayMode): void {
    displayMode.value = mode
  }

  /**
   * 展开/折叠分组
   */
  function toggleGroup(marketHashName: string): void {
    if (expandedGroups.value.has(marketHashName)) {
      expandedGroups.value.delete(marketHashName)
    } else {
      expandedGroups.value.add(marketHashName)
    }
  }

  /**
   * 检查分组是否展开
   */
  function isGroupExpanded(marketHashName: string): boolean {
    return expandedGroups.value.has(marketHashName)
  }

  /**
   * 选择物品
   */
  function selectItem(itemId: string): void {
    if (selectedIds.value.has(itemId)) {
      selectedIds.value.delete(itemId)
    } else {
      selectedIds.value.add(itemId)
    }
  }

  /**
   * 全选
   */
  function selectAll(): void {
    for (const item of displayItems.value) {
      selectedIds.value.add(item.id)
    }
  }

  /**
   * 取消全选
   */
  function clearSelection(): void {
    selectedIds.value.clear()
  }

  /**
   * 检查物品是否选中
   */
  function isSelected(itemId: string): boolean {
    return selectedIds.value.has(itemId)
  }

  /**
   * 检查物品是否正在操作中
   */
  function isOperating(assetId: string): boolean {
    return operatingIds.value.has(assetId)
  }

  // ============================================================================
  // Actions - 其他
  // ============================================================================

  /**
   * 清除在售数据
   */
  function clearSellingItems(): void {
    rawItems.value = []
    total.value = 0
    currentPage.value = 1
    lastUpdated.value = null
    initialized.value = false
    error.value = null
    clearSelection()
  }

  /**
   * 失效缓存
   */
  function invalidateCache(): void {
    sellingHybridCache.clear()
    lastUpdated.value = null
    logger.log('[SellingStore] 缓存已失效')
  }

  /**
   * 获取分组物品
   */
  function getGroupItems(marketHashName: string): SellingItem[] {
    return groupedItems.value[marketHashName] || []
  }

  /**
   * 获取分组数量
   */
  function getGroupCount(marketHashName: string): number {
    return groupedItems.value[marketHashName]?.length || 0
  }

  // ============================================================================
  // Watchers
  // ============================================================================

  // 监听平台切换，重置数据
  watch(
    () => platformStore.currentPlatform,
    () => {
      clearSellingItems()
      sellHistory.value = []
      // 如果已初始化，自动加载新平台数据
      if (platformStore.initialized && platformStore.isCurrentPlatformConfigured) {
        fetchSellingItems()
      }
    }
  )

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    rawItems,
    currentPage,
    pageSize,
    total,
    loading,
    refreshing,
    initialized,
    displayMode,
    filter,
    sort,
    expandedGroups,
    selectedIds,
    lastUpdated,
    error,
    operatingIds,
    sellHistory,
    historyFilter,
    historyLoading,

    // Computed
    currentPlatform,
    filteredItems,
    sortedItems,
    groupedItems,
    displayItems,
    stats,
    historyStats,
    isBatchMode,
    selectedItems,
    hasCachedData,
    isCacheExpired,

    // Actions - 数据加载
    fetchSellingItems,
    refreshSellingItems,
    fetchSellHistory,

    // Actions - 上架/下架/改价
    listItem,
    delistItem,
    changePrice,
    batchList,
    batchDelist,

    // Actions - 分页和筛选
    changePage,
    changePageSize,
    setFilter,
    clearFilter,
    setSort,
    setHistoryFilter,

    // Actions - 展示模式和选择
    toggleDisplayMode,
    setDisplayMode,
    toggleGroup,
    isGroupExpanded,
    selectItem,
    selectAll,
    clearSelection,
    isSelected,
    isOperating,

    // Actions - 其他
    clearSellingItems,
    invalidateCache,
    getGroupItems,
    getGroupCount
  }
})

export type UseSellingStoreReturn = ReturnType<typeof useSellingStore>
