/**
 * 批量操作 Composable
 *
 * 管理批量选择和批量操作功能
 */

import { ref, computed } from 'vue'
import type { InventoryItem } from '@/types/inventory'
import type { SellingItem } from '@/types/selling'
import { toast } from '@/utils/toast'

type BatchItem = InventoryItem | SellingItem

/**
 * 批量操作 Composable
 */
export function useBatchOperation<T extends BatchItem>(
  items: () => T[],
  options: {
    maxSelection?: number
    onSelectionChange?: (selectedIds: Set<string>) => void
  } = {}
) {
  const { maxSelection = 100, onSelectionChange } = options

  // 选中的物品ID集合
  const selectedIds = ref<Set<string>>(new Set())

  // 是否处于批量模式
  const isBatchMode = ref(false)

  // 是否正在执行批量操作
  const isProcessing = ref(false)

  // 选中的物品数量
  const selectedCount = computed(() => selectedIds.value.size)

  // 是否有选中的物品
  const hasSelection = computed(() => selectedCount.value > 0)

  // 是否全选
  const isAllSelected = computed(() => {
    const currentItems = items()
    return currentItems.length > 0 && selectedCount.value === currentItems.length
  })

  // 选中的物品列表
  const selectedItems = computed(() => {
    const currentItems = items()
    return currentItems.filter(item => selectedIds.value.has(item.id))
  })

  // 进入批量模式
  function enterBatchMode(): void {
    isBatchMode.value = true
  }

  // 退出批量模式
  function exitBatchMode(): void {
    isBatchMode.value = false
    clearSelection()
  }

  // 切换批量模式
  function toggleBatchMode(): void {
    if (isBatchMode.value) {
      exitBatchMode()
    } else {
      enterBatchMode()
    }
  }

  // 选择物品
  function selectItem(itemId: string): boolean {
    if (selectedIds.value.size >= maxSelection) {
      toast.warning(`最多只能选择 ${maxSelection} 个物品`)
      return false
    }

    selectedIds.value.add(itemId)
    onSelectionChange?.(selectedIds.value)
    return true
  }

  // 取消选择物品
  function deselectItem(itemId: string): void {
    selectedIds.value.delete(itemId)
    onSelectionChange?.(selectedIds.value)
  }

  // 切换物品选择状态
  function toggleItem(itemId: string): boolean {
    if (selectedIds.value.has(itemId)) {
      deselectItem(itemId)
      return false
    } else {
      return selectItem(itemId)
    }
  }

  // 检查物品是否被选中
  function isSelected(itemId: string): boolean {
    return selectedIds.value.has(itemId)
  }

  // 全选
  function selectAll(): void {
    const currentItems = items()
    const toSelect = currentItems.slice(0, maxSelection)

    selectedIds.value.clear()
    toSelect.forEach(item => selectedIds.value.add(item.id))

    if (currentItems.length > maxSelection) {
      toast.warning(`已选择前 ${maxSelection} 个物品`)
    }

    onSelectionChange?.(selectedIds.value)
  }

  // 取消全选
  function deselectAll(): void {
    selectedIds.value.clear()
    onSelectionChange?.(selectedIds.value)
  }

  // 清空选择
  function clearSelection(): void {
    selectedIds.value.clear()
    onSelectionChange?.(selectedIds.value)
  }

  // 切换全选状态
  function toggleSelectAll(): void {
    if (isAllSelected.value) {
      deselectAll()
    } else {
      selectAll()
    }
  }

  // 按条件选择
  function selectByCondition(predicate: (item: T) => boolean): void {
    const currentItems = items()
    let count = 0

    currentItems.forEach(item => {
      if (predicate(item) && count < maxSelection) {
        selectedIds.value.add(item.id)
        count++
      }
    })

    onSelectionChange?.(selectedIds.value)
  }

  // 选择可交易的物品
  function selectTradable(): void {
    selectByCondition(item => item.tradable)
  }

  // 选择指定分组的物品
  function selectByGroup(groupName: string): void {
    selectByCondition(item => item.marketHashName === groupName)
  }

  // 执行批量操作
  async function executeBatchOperation<R>(
    operation: (items: T[]) => Promise<R>,
    options: {
      onSuccess?: (result: R) => void
      onError?: (error: Error) => void
      clearAfterSuccess?: boolean
    } = {}
  ): Promise<R | null> {
    const { onSuccess, onError, clearAfterSuccess = true } = options

    if (!hasSelection.value) {
      toast.warning('请先选择物品')
      return null
    }

    isProcessing.value = true

    try {
      const result = await operation(selectedItems.value)
      onSuccess?.(result)

      if (clearAfterSuccess) {
        clearSelection()
      }

      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error('操作失败')
      onError?.(err)
      toast.error(err.message)
      return null
    } finally {
      isProcessing.value = false
    }
  }

  return {
    // 状态
    selectedIds,
    isBatchMode,
    isProcessing,
    selectedCount,
    hasSelection,
    isAllSelected,
    selectedItems,

    // 批量模式操作
    enterBatchMode,
    exitBatchMode,
    toggleBatchMode,

    // 选择操作
    selectItem,
    deselectItem,
    toggleItem,
    isSelected,
    selectAll,
    deselectAll,
    clearSelection,
    toggleSelectAll,

    // 条件选择
    selectByCondition,
    selectTradable,
    selectByGroup,

    // 批量操作
    executeBatchOperation
  }
}

export type UseBatchOperationReturn<T extends BatchItem> = ReturnType<
  typeof useBatchOperation<T>
>
