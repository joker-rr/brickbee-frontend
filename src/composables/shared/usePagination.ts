import { ref, computed, type Ref } from 'vue'
import { appConfig } from '@/config'

/**
 * 分页配置
 */
interface UsePaginationOptions {
  /** 初始页码 */
  initialPage?: number
  /** 每页数量 */
  pageSize?: number
  /** 总数 */
  total?: Ref<number>
}

/**
 * 分页 Composable
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, pageSize = appConfig.pagination.defaultPageSize, total: totalRef } = options

  const currentPage = ref(initialPage)
  const currentPageSize = ref(pageSize)
  const total = totalRef || ref(0)

  /**
   * 总页数
   */
  const totalPages = computed(() => {
    return Math.ceil(total.value / currentPageSize.value)
  })

  /**
   * 是否有上一页
   */
  const hasPrevPage = computed(() => {
    return currentPage.value > 1
  })

  /**
   * 是否有下一页
   */
  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value
  })

  /**
   * 跳转到指定页
   */
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) {
      return
    }
    currentPage.value = page
  }

  /**
   * 上一页
   */
  const prevPage = () => {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }

  /**
   * 下一页
   */
  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  /**
   * 改变每页数量
   */
  const changePageSize = (size: number) => {
    currentPageSize.value = size
    currentPage.value = 1 // 重置到第一页
  }

  /**
   * 重置分页
   */
  const reset = () => {
    currentPage.value = initialPage
    currentPageSize.value = pageSize
  }

  /**
   * 分页参数（用于 API 请求）
   */
  const paginationParams = computed(() => ({
    page: currentPage.value,
    pageSize: currentPageSize.value
  }))

  return {
    currentPage,
    currentPageSize,
    total,
    totalPages,
    hasPrevPage,
    hasNextPage,
    goToPage,
    prevPage,
    nextPage,
    changePageSize,
    reset,
    paginationParams
  }
}
