/**
 * ============================================================================
 * 文件名：useItems.ts
 * 位置：src/composables/business/useItems.ts
 * 作用：封装物品列表的业务逻辑
 * 为什么需要：
 *   1. 统一管理物品列表的状态和操作
 *   2. 复用列表加载、分页、筛选逻辑
 *   3. 与组件分离，提高可测试性
 * ============================================================================
 */

import { ref, watch, type Ref } from 'vue'
import { itemsApi, type SteamItem, type FilterOption } from '@/api'
// import { toast } from '@/utils/toast'
// import { ErrorHandler } from '@/utils/http/errorHandler'
/**
 * useItems 返回值类型
 */
export interface UseItemsReturn {
  // 状态
  items: Ref<SteamItem[]>
  total: Ref<number>
  loading: Ref<boolean>
  error: Ref<Error | null>
  currentPage: Ref<number>
  hasMore: Ref<boolean>

  // 方法
  loadMore: () => Promise<void>
  reset: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * 物品列表 Composable
 *
 * @param filters - 筛选条件（响应式）
 * @param pageSize - 每页数量
 * @returns 物品列表的状态和操作方法
 *
 * 使用示例：
 * ```ts
 * const filters = ref<FilterOption[]>([]);
 * const { items, total, loading, error, loadMore, reset } = useItems(filters);
 *
 * // 监听筛选条件变化
 * watch(filters, reset, { deep: true });
 * ```
 */
export function useItems(
  filters: Ref<FilterOption[]>,
  pageSize = 30
): UseItemsReturn {
  // --------------------------------------------------------------------------
  // 状态
  // --------------------------------------------------------------------------

  /**
   * 物品列表
   */
  const items = ref<SteamItem[]>([])

  /**
   * 总数量
   */
  const total = ref(0)

  /**
   * 加载状态
   */
  const loading = ref(false)

  /**
   * 错误状态
   */
  const error = ref<Error | null>(null)

  /**
   * 当前页码
   */
  const currentPage = ref(1)

  /**
   * 是否还有更多数据
   */
  const hasMore = ref(true)

  // --------------------------------------------------------------------------
  // 方法
  // --------------------------------------------------------------------------

  /**
   * 获取物品列表
   *
   * @param start - 起始位置
   * @param count - 数量
   * @param filterOptions - 筛选条件
   */
  const fetchItems = async (
    start: number,
    count: number,
    filterOptions: FilterOption[]
  ) => {
    try {
      error.value = null

      const response = await itemsApi.getList({
        start,
        pageSize: count,
        filters: filterOptions,
      })

      return response
    } catch (err) {
      error.value = err as Error


      throw err
    }
  }

  /**
   * 加载更多物品
   *
   * 使用场景：滚动到底部时触发
   */
  const loadMore = async () => {
    // 如果正在加载或没有更多数据，直接返回
    if (loading.value || !hasMore.value) {
      return
    }

    loading.value = true

    try {
      const start = (currentPage.value - 1) * pageSize
      const result = await fetchItems(start, pageSize, filters.value)

      // 合并数据
      items.value = [...items.value, ...result.list]
      total.value = result.total

      // 更新分页状态
      currentPage.value++

      // 检查是否还有更多数据
      hasMore.value = items.value.length < result.total
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置列表（筛选条件变化时使用）
   *
   * 使用场景：
   * - 筛选条件变化
   * - 排序方式变化
   */
  const reset = async () => {
    // 清空数据
    items.value = []
    total.value = 0
    currentPage.value = 1
    hasMore.value = true
    error.value = null

    // 加载第一页
    loading.value = true

    try {
      const result = await fetchItems(0, pageSize, filters.value)

      items.value = result.list
      total.value = result.total
      currentPage.value = 2 // 下次从第二页开始

      // 检查是否还有更多数据
      hasMore.value = result.list.length < result.total
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新当前列表（保持当前页码）
   *
   * 使用场景：用户手动刷新
   */
  const refresh = async () => {
    loading.value = true
    error.value = null

    try {
      // 重新加载所有已加载的数据
      const totalItems = (currentPage.value - 1) * pageSize
      const result = await fetchItems(0, totalItems, filters.value)

      items.value = result.list
      total.value = result.total

      // 检查是否还有更多数据
      hasMore.value = result.list.length < result.total
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }

  // --------------------------------------------------------------------------
  // 初始化：加载第一页
  // --------------------------------------------------------------------------

  reset()

  // --------------------------------------------------------------------------
  // 监听筛选条件变化
  // --------------------------------------------------------------------------

  watch(
    filters,
    () => {
      reset()
    },
    { deep: true }
  )

  // --------------------------------------------------------------------------
  // 返回
  // --------------------------------------------------------------------------

  return {
    // 状态
    items,
    total,
    loading,
    error,
    currentPage,
    hasMore,

    // 方法
    loadMore,
    reset,
    refresh,
  }
}
