/**
 * 表格逻辑 Composable
 *
 * 提供表格的通用逻辑：排序、筛选、选择等
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

/**
 * 排序方向
 */
export type SortOrder = 'asc' | 'desc' | null

/**
 * 排序配置
 */
export interface SortConfig {
  key: string
  order: SortOrder
}

/**
 * 表格列配置
 */
export interface TableColumn<T = unknown> {
  key: string
  label: string
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown, row: T, index: number) => string
}

/**
 * 表格 Composable 选项
 */
export interface UseTableOptions<T> {
  /** 初始数据 */
  data?: T[] | Ref<T[]>
  /** 列配置 */
  columns?: TableColumn<T>[]
  /** 默认排序 */
  defaultSort?: SortConfig
  /** 是否支持多选 */
  selectable?: boolean
  /** 行唯一键 */
  rowKey?: keyof T | ((row: T) => string | number)
}

/**
 * 表格 Composable 返回值
 */
export interface UseTableReturn<T> {
  /** 表格数据 */
  data: Ref<T[]>
  /** 处理后的数据（排序、筛选后） */
  processedData: ComputedRef<T[]>
  /** 列配置 */
  columns: Ref<TableColumn<T>[]>
  /** 当前排序 */
  sortConfig: Ref<SortConfig | null>
  /** 选中的行 */
  selectedRows: Ref<T[]>
  /** 选中的行键 */
  selectedKeys: ComputedRef<(string | number)[]>
  /** 是否全选 */
  isAllSelected: ComputedRef<boolean>
  /** 是否部分选中 */
  isIndeterminate: ComputedRef<boolean>
  /** 排序 */
  sort: (key: string, order?: SortOrder) => void
  /** 切换排序 */
  toggleSort: (key: string) => void
  /** 清除排序 */
  clearSort: () => void
  /** 选择行 */
  selectRow: (row: T) => void
  /** 取消选择行 */
  unselectRow: (row: T) => void
  /** 切换行选择 */
  toggleRowSelection: (row: T) => void
  /** 全选 */
  selectAll: () => void
  /** 取消全选 */
  unselectAll: () => void
  /** 切换全选 */
  toggleSelectAll: () => void
  /** 是否选中 */
  isSelected: (row: T) => boolean
  /** 获取行键 */
  getRowKey: (row: T) => string | number
  /** 设置数据 */
  setData: (newData: T[]) => void
}

/**
 * 表格逻辑 Composable
 */
export function useTable<T extends Record<string, unknown>>(
  options: UseTableOptions<T> = {}
): UseTableReturn<T> {
  const {
    data: initialData = [],
    columns: initialColumns = [],
    defaultSort = null,
    selectable = true,
    rowKey = 'id'
  } = options

  // 表格数据
  const data = ref<T[]>(
    Array.isArray(initialData) ? initialData : initialData.value
  ) as Ref<T[]>

  // 如果传入的是响应式数据，监听变化
  if (!Array.isArray(initialData)) {
    watch(initialData, (newData) => {
      data.value = newData
    })
  }

  // 列配置
  const columns = ref<TableColumn<T>[]>(initialColumns)

  // 排序配置
  const sortConfig = ref<SortConfig | null>(defaultSort)

  // 选中的行
  const selectedRows = ref<T[]>([]) as Ref<T[]>

  /**
   * 获取行键
   */
  const getRowKey = (row: T): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row)
    }
    return row[rowKey] as string | number
  }

  /**
   * 处理后的数据（排序后）
   */
  const processedData = computed(() => {
    let result = [...data.value]

    // 排序
    if (sortConfig.value?.key && sortConfig.value?.order) {
      const { key, order } = sortConfig.value

      result.sort((a, b) => {
        const aVal = a[key]
        const bVal = b[key]

        let comparison = 0

        if (aVal === null || aVal === undefined) comparison = 1
        else if (bVal === null || bVal === undefined) comparison = -1
        else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        } else {
          comparison = String(aVal).localeCompare(String(bVal))
        }

        return order === 'desc' ? -comparison : comparison
      })
    }

    return result
  })

  /**
   * 选中的行键
   */
  const selectedKeys = computed(() => {
    return selectedRows.value.map((row) => getRowKey(row))
  })

  /**
   * 是否全选
   */
  const isAllSelected = computed(() => {
    if (data.value.length === 0) return false
    return selectedRows.value.length === data.value.length
  })

  /**
   * 是否部分选中
   */
  const isIndeterminate = computed(() => {
    return selectedRows.value.length > 0 && selectedRows.value.length < data.value.length
  })

  /**
   * 排序
   */
  const sort = (key: string, order?: SortOrder): void => {
    if (order === null) {
      sortConfig.value = null
    } else {
      sortConfig.value = { key, order: order || 'asc' }
    }
  }

  /**
   * 切换排序
   */
  const toggleSort = (key: string): void => {
    if (!sortConfig.value || sortConfig.value.key !== key) {
      sortConfig.value = { key, order: 'asc' }
    } else if (sortConfig.value.order === 'asc') {
      sortConfig.value = { key, order: 'desc' }
    } else {
      sortConfig.value = null
    }
  }

  /**
   * 清除排序
   */
  const clearSort = (): void => {
    sortConfig.value = null
  }

  /**
   * 是否选中
   */
  const isSelected = (row: T): boolean => {
    const key = getRowKey(row)
    return selectedKeys.value.includes(key)
  }

  /**
   * 选择行
   */
  const selectRow = (row: T): void => {
    if (!selectable) return
    if (!isSelected(row)) {
      selectedRows.value.push(row)
    }
  }

  /**
   * 取消选择行
   */
  const unselectRow = (row: T): void => {
    const key = getRowKey(row)
    const index = selectedRows.value.findIndex((r) => getRowKey(r) === key)
    if (index > -1) {
      selectedRows.value.splice(index, 1)
    }
  }

  /**
   * 切换行选择
   */
  const toggleRowSelection = (row: T): void => {
    if (isSelected(row)) {
      unselectRow(row)
    } else {
      selectRow(row)
    }
  }

  /**
   * 全选
   */
  const selectAll = (): void => {
    if (!selectable) return
    selectedRows.value = [...data.value]
  }

  /**
   * 取消全选
   */
  const unselectAll = (): void => {
    selectedRows.value = []
  }

  /**
   * 切换全选
   */
  const toggleSelectAll = (): void => {
    if (isAllSelected.value) {
      unselectAll()
    } else {
      selectAll()
    }
  }

  /**
   * 设置数据
   */
  const setData = (newData: T[]): void => {
    data.value = newData
    // 清除不存在的选中项
    const newKeys = new Set(newData.map(getRowKey))
    selectedRows.value = selectedRows.value.filter((row) => newKeys.has(getRowKey(row)))
  }

  return {
    data,
    processedData,
    columns,
    sortConfig,
    selectedRows,
    selectedKeys,
    isAllSelected,
    isIndeterminate,
    sort,
    toggleSort,
    clearSort,
    selectRow,
    unselectRow,
    toggleRowSelection,
    selectAll,
    unselectAll,
    toggleSelectAll,
    isSelected,
    getRowKey,
    setData
  }
}
