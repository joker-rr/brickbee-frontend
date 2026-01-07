/**
 * 物品展示模式 Composable
 *
 * 管理库存物品的展示模式（分开/组合）
 */

import { ref, computed, watch } from 'vue'
import type { InventoryItem, GroupedItems, DisplayMode } from '@/types/inventory'
import { storage } from '@/utils/cache/storage'

const STORAGE_KEY = 'inventory_display_mode'

/**
 * 物品展示模式 Composable
 */
export function useItemDisplay(items: () => InventoryItem[]) {
  // 展示模式
  const displayMode = ref<DisplayMode>(
    (storage.get(STORAGE_KEY) as DisplayMode) || 'grouped'
  )

  // 展开的分组
  const expandedGroups = ref<Set<string>>(new Set())

  // 是否全部展开模式
  const isExpanded = computed(() => displayMode.value === 'expanded')

  // 是否分组模式
  const isGrouped = computed(() => displayMode.value === 'grouped')

  // 按市场哈希名分组
  const groupedItems = computed<GroupedItems>(() => {
    const currentItems = items()
    const grouped: GroupedItems = {}

    for (const item of currentItems) {
      const name = item.marketHashName
      if (!grouped[name]) {
        grouped[name] = []
      }
      grouped[name].push(item)
    }

    return grouped
  })

  // 分组名称列表
  const groupNames = computed(() => Object.keys(groupedItems.value))

  // 分组数量
  const groupCount = computed(() => groupNames.value.length)

  // 总物品数量
  const totalCount = computed(() => items().length)

  // 切换展示模式
  function toggleDisplayMode(): void {
    displayMode.value = displayMode.value === 'expanded' ? 'grouped' : 'expanded'
    storage.set(STORAGE_KEY, displayMode.value)
  }

  // 设置展示模式
  function setDisplayMode(mode: DisplayMode): void {
    displayMode.value = mode
    storage.set(STORAGE_KEY, mode)
  }

  // 展开分组
  function expandGroup(groupName: string): void {
    expandedGroups.value.add(groupName)
  }

  // 收起分组
  function collapseGroup(groupName: string): void {
    expandedGroups.value.delete(groupName)
  }

  // 切换分组展开状态
  function toggleGroup(groupName: string): void {
    if (expandedGroups.value.has(groupName)) {
      collapseGroup(groupName)
    } else {
      expandGroup(groupName)
    }
  }

  // 检查分组是否展开
  function isGroupExpanded(groupName: string): boolean {
    return expandedGroups.value.has(groupName)
  }

  // 展开所有分组
  function expandAllGroups(): void {
    groupNames.value.forEach(name => expandedGroups.value.add(name))
  }

  // 收起所有分组
  function collapseAllGroups(): void {
    expandedGroups.value.clear()
  }

  // 获取分组的物品数量
  function getGroupItemCount(groupName: string): number {
    return groupedItems.value[groupName]?.length || 0
  }

  // 获取分组的第一个物品（用于预览）
  function getGroupPreviewItem(groupName: string): InventoryItem | undefined {
    return groupedItems.value[groupName]?.[0]
  }

  // 获取分组的物品
  function getGroupItems(groupName: string): InventoryItem[] {
    return groupedItems.value[groupName] || []
  }

  // 监听模式变化，重置展开状态
  watch(displayMode, () => {
    if (displayMode.value === 'expanded') {
      expandedGroups.value.clear()
    }
  })

  return {
    // 状态
    displayMode,
    isExpanded,
    isGrouped,
    expandedGroups,

    // 分组数据
    groupedItems,
    groupNames,
    groupCount,
    totalCount,

    // 模式操作
    toggleDisplayMode,
    setDisplayMode,

    // 分组展开操作
    expandGroup,
    collapseGroup,
    toggleGroup,
    isGroupExpanded,
    expandAllGroups,
    collapseAllGroups,

    // 分组数据获取
    getGroupItemCount,
    getGroupPreviewItem,
    getGroupItems
  }
}

export type UseItemDisplayReturn = ReturnType<typeof useItemDisplay>
