/**
 * 库存逻辑 Composable
 *
 * 处理库存数据的筛选、排序、分组、统计、选择
 * 从 inventoryStore 迁移逻辑处理
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { PlatformType } from '@/config/platform.config'
import type {
  InventoryItem,
  GroupedItems,
  DisplayMode,
  ItemStats,
  InventoryFilter,
  InventorySort
} from '@/types/inventory'
import { useProfitCalculator } from '../useProfitCalculator'
import { groupByMarketHashName } from '../useDataNormalizer'

// ============================================================================
// 类型定义
// ============================================================================

export interface UseInventoryLogicOptions {
  /** 默认展示模式 */
  defaultDisplayMode?: DisplayMode
  /** 默认排序 */
  defaultSort?: InventorySort
  /** 汇率（MARKET 平台使用） */
  exchangeRate?: Ref<number>
}

export interface UseInventoryLogicReturn {
  // 筛选
  filter: Ref<InventoryFilter>
  filteredItems: ComputedRef<InventoryItem[]>
  setFilter: (newFilter: Partial<InventoryFilter>) => void
  clearFilter: () => void

  // 排序
  sort: Ref<InventorySort>
  sortedItems: ComputedRef<InventoryItem[]>
  setSort: (newSort: InventorySort) => void

  // 分组
  displayMode: Ref<DisplayMode>
  groupedItems: ComputedRef<GroupedItems>
  displayItems: ComputedRef<InventoryItem[]>
  toggleDisplayMode: () => void
  setDisplayMode: (mode: DisplayMode) => void

  // 统计
  stats: ComputedRef<ItemStats>

  // 选择管理
  selectedIds: Ref<Set<string>>
  selectedItems: ComputedRef<InventoryItem[]>
  isBatchMode: ComputedRef<boolean>
  selectItem: (itemId: string) => void
  deselectItem: (itemId: string) => void
  toggleSelect: (itemId: string) => void
  selectAll: () => void
  clearSelection: () => void
  isSelected: (itemId: string) => boolean

  // 分组展开管理
  expandedGroups: Ref<Set<string>>
  toggleGroup: (marketHashName: string) => void
  expandGroup: (marketHashName: string) => void
  collapseGroup: (marketHashName: string) => void
  isGroupExpanded: (marketHashName: string) => boolean
  expandAllGroups: () => void
  collapseAllGroups: () => void
  getGroupItems: (marketHashName: string) => InventoryItem[]
  getGroupCount: (marketHashName: string) => number
}

// ============================================================================
// Composable
// ============================================================================

/**
 * 库存逻辑 Composable
 *
 * @param items 库存物品列表（响应式）
 * @param platform 平台类型
 * @param options 配置选项
 */
export function useInventoryLogic(
  items: Ref<InventoryItem[]> | (() => InventoryItem[]),
  platform: Ref<PlatformType> | (() => PlatformType),
  options: UseInventoryLogicOptions = {}
): UseInventoryLogicReturn {
  const {
    defaultDisplayMode = 'expanded',
    defaultSort = { field: 'name', order: 'asc' },
    exchangeRate
  } = options

  // 获取物品列表
  const getItems = (): InventoryItem[] => {
    if (typeof items === 'function') return items()
    return items.value
  }

  // 获取平台类型
  const getPlatform = (): PlatformType => {
    if (typeof platform === 'function') return platform()
    return platform.value
  }

  // 利润计算器
  const { calculateProfit } = useProfitCalculator(() => getPlatform())

  // ============================================================================
  // 筛选
  // ============================================================================

  const filter = ref<InventoryFilter>({})

  const filteredItems = computed<InventoryItem[]>(() => {
    let result = [...getItems()]

    // 搜索过滤
    if (filter.value.search) {
      const keyword = filter.value.search.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.marketHashName.toLowerCase().includes(keyword)
      )
    }

    // 可交易过滤
    if (filter.value.tradableOnly) {
      result = result.filter((item) => item.tradable)
    }

    // 稀有度过滤
    if (filter.value.rarity?.length) {
      result = result.filter(
        (item) =>
          item.detail?.rarity?.rarity && filter.value.rarity!.includes(item.detail.rarity.rarity)
      )
    }

    // 类型过滤
    if (filter.value.type?.length) {
      result = result.filter((item) => filter.value.type!.includes(item.type))
    }

    // 价格范围过滤
    if (filter.value.priceRange) {
      const { min, max } = filter.value.priceRange
      result = result.filter((item) => {
        const price = item.marketPrice || 0
        if (min !== undefined && price < min) return false
        if (max !== undefined && price > max) return false
        return true
      })
    }

    return result
  })

  const setFilter = (newFilter: Partial<InventoryFilter>): void => {
    filter.value = { ...filter.value, ...newFilter }
  }

  const clearFilter = (): void => {
    filter.value = {}
  }

  // ============================================================================
  // 排序
  // ============================================================================

  const sort = ref<InventorySort>(defaultSort)

  const sortedItems = computed<InventoryItem[]>(() => {
    const itemsToSort = [...filteredItems.value]
    const { field, order } = sort.value
    const multiplier = order === 'asc' ? 1 : -1

    itemsToSort.sort((a, b) => {
      let valueA: number | string = 0
      let valueB: number | string = 0

      switch (field) {
        case 'name':
          valueA = a.name
          valueB = b.name
          return multiplier * valueA.localeCompare(valueB)

        case 'price':
          valueA = a.marketPrice || 0
          valueB = b.marketPrice || 0
          break

        case 'costPrice':
          valueA = a.costPrice || 0
          valueB = b.costPrice || 0
          break

        case 'profit':
          valueA = calculateProfit(a.marketPrice || 0, a.costPrice || 0, exchangeRate?.value)
          valueB = calculateProfit(b.marketPrice || 0, b.costPrice || 0, exchangeRate?.value)
          break

        default:
          return 0
      }

      return multiplier * ((valueA as number) - (valueB as number))
    })

    return itemsToSort
  })

  const setSort = (newSort: InventorySort): void => {
    sort.value = newSort
  }

  // ============================================================================
  // 分组
  // ============================================================================

  const displayMode = ref<DisplayMode>(defaultDisplayMode)

  const groupedItems = computed<GroupedItems>(() => {
    return groupByMarketHashName(sortedItems.value)
  })

  const displayItems = computed<InventoryItem[]>(() => {
    if (displayMode.value === 'expanded') {
      return sortedItems.value
    }

    // 分组模式：只返回每组第一个物品（作为代表）
    const representatives: InventoryItem[] = []
    for (const [, groupItems] of Object.entries(groupedItems.value)) {
      if (groupItems.length > 0) {
        representatives.push(groupItems[0])
      }
    }

    return representatives
  })

  const toggleDisplayMode = (): void => {
    displayMode.value = displayMode.value === 'expanded' ? 'grouped' : 'expanded'
  }

  const setDisplayMode = (mode: DisplayMode): void => {
    displayMode.value = mode
  }

  // ============================================================================
  // 统计
  // ============================================================================

  const stats = computed<ItemStats>(() => {
    const allItems = getItems()
    let totalValue = 0
    let totalCost = 0
    let totalProfit = 0
    let tradableCount = 0

    for (const item of allItems) {
      if (item.marketPrice) {
        totalValue += item.marketPrice
      }
      if (item.costPrice) {
        totalCost += item.costPrice
      }
      if (item.marketPrice && item.costPrice) {
        totalProfit += calculateProfit(item.marketPrice, item.costPrice, exchangeRate?.value)
      }
      if (item.tradable) {
        tradableCount++
      }
    }

    return {
      totalCount: allItems.length,
      totalValue: Number(totalValue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      tradableCount,
      averageCost: allItems.length > 0 ? Number((totalCost / allItems.length).toFixed(2)) : 0
    }
  })

  // ============================================================================
  // 选择管理
  // ============================================================================

  const selectedIds = ref<Set<string>>(new Set())

  const selectedItems = computed<InventoryItem[]>(() => {
    return getItems().filter((item) => selectedIds.value.has(item.id))
  })

  const isBatchMode = computed(() => selectedIds.value.size > 0)

  const selectItem = (itemId: string): void => {
    selectedIds.value.add(itemId)
  }

  const deselectItem = (itemId: string): void => {
    selectedIds.value.delete(itemId)
  }

  const toggleSelect = (itemId: string): void => {
    if (selectedIds.value.has(itemId)) {
      selectedIds.value.delete(itemId)
    } else {
      selectedIds.value.add(itemId)
    }
  }

  const selectAll = (): void => {
    for (const item of displayItems.value) {
      selectedIds.value.add(item.id)
    }
  }

  const clearSelection = (): void => {
    selectedIds.value.clear()
  }

  const isSelected = (itemId: string): boolean => {
    return selectedIds.value.has(itemId)
  }

  // ============================================================================
  // 分组展开管理
  // ============================================================================

  const expandedGroups = ref<Set<string>>(new Set())

  const toggleGroup = (marketHashName: string): void => {
    if (expandedGroups.value.has(marketHashName)) {
      expandedGroups.value.delete(marketHashName)
    } else {
      expandedGroups.value.add(marketHashName)
    }
  }

  const expandGroup = (marketHashName: string): void => {
    expandedGroups.value.add(marketHashName)
  }

  const collapseGroup = (marketHashName: string): void => {
    expandedGroups.value.delete(marketHashName)
  }

  const isGroupExpanded = (marketHashName: string): boolean => {
    return expandedGroups.value.has(marketHashName)
  }

  const expandAllGroups = (): void => {
    for (const key of Object.keys(groupedItems.value)) {
      expandedGroups.value.add(key)
    }
  }

  const collapseAllGroups = (): void => {
    expandedGroups.value.clear()
  }

  const getGroupItems = (marketHashName: string): InventoryItem[] => {
    return groupedItems.value[marketHashName] || []
  }

  const getGroupCount = (marketHashName: string): number => {
    return groupedItems.value[marketHashName]?.length || 0
  }

  // ============================================================================
  // 返回
  // ============================================================================

  return {
    // 筛选
    filter,
    filteredItems,
    setFilter,
    clearFilter,

    // 排序
    sort,
    sortedItems,
    setSort,

    // 分组
    displayMode,
    groupedItems,
    displayItems,
    toggleDisplayMode,
    setDisplayMode,

    // 统计
    stats,

    // 选择管理
    selectedIds,
    selectedItems,
    isBatchMode,
    selectItem,
    deselectItem,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,

    // 分组展开管理
    expandedGroups,
    toggleGroup,
    expandGroup,
    collapseGroup,
    isGroupExpanded,
    expandAllGroups,
    collapseAllGroups,
    getGroupItems,
    getGroupCount
  }
}

