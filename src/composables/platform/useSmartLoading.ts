/**
 * 智能加载管理 Composable
 *
 * 提供基于视口的懒加载功能，支持：
 * - IntersectionObserver 视口检测
 * - 并发控制
 * - 滚动速度检测
 * - 请求取消
 */

import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { InventoryItem } from '@/types/inventory'

export interface SmartLoadingOptions {
  /** 最大并发数 */
  maxConcurrent?: number
  /** 视口边距 */
  rootMargin?: string
  /** 可见阈值 */
  threshold?: number
  /** 滚动停止检测延迟 */
  scrollDebounce?: number
  /** 快速滚动阈值 (px/s) */
  fastScrollThreshold?: number
}

interface LoadingStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cancelledRequests: number
  currentlyLoading: number
  waitingInQueue: number
}

/**
 * 智能加载管理 Composable
 */
export function useSmartLoading(options: SmartLoadingOptions = {}) {
  const {
    maxConcurrent = 3,
    rootMargin = '50px',
    threshold = 0.1,
    scrollDebounce = 150,
    fastScrollThreshold = 1000
  } = options

  // 注册的物品
  const items = ref<Map<string, InventoryItem>>(new Map())

  // 正在加载的物品
  const loadingItems = ref<Map<string, AbortController>>(new Map())

  // 已加载的物品
  const loadedItems = ref<Set<string>>(new Set())

  // 等待队列
  const waitingQueue = ref<
    Map<string, { item: InventoryItem; addedAt: number; priority: number }>
  >(new Map())

  // 统计信息
  const stats = ref<LoadingStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cancelledRequests: 0,
    currentlyLoading: 0,
    waitingInQueue: 0
  })

  // 滚动状态
  const isScrolling = ref(false)
  const isFastScrolling = ref(false)

  // 获取函数
  let fetchFunction: ((item: InventoryItem, signal: AbortSignal) => Promise<unknown>) | null =
    null

  // Observer 实例
  let observer: IntersectionObserver | null = null

  // 滚动定时器
  let scrollTimer: ReturnType<typeof setTimeout> | null = null

  // 滚动处理函数引用
  let handleScroll: (() => void) | null = null

  /**
   * 获取物品ID
   */
  function getItemId(item: InventoryItem): string {
    return item.id || item.assetId
  }

  /**
   * 设置获取函数
   */
  function setFetchFunction(
    fn: (item: InventoryItem, signal: AbortSignal) => Promise<unknown>
  ): void {
    fetchFunction = fn
  }

  /**
   * 注册物品
   */
  function registerItem(item: InventoryItem, element: HTMLElement): void {
    if (!item) return

    const itemId = getItemId(item)
    if (!itemId) return

    // 已注册或已有详情则跳过
    if (items.value.has(itemId) || item.detail) return

    items.value.set(itemId, item)

    // 开始观察
    if (observer && element) {
      element.dataset.itemId = itemId
      observer.observe(element)
    }
  }

  /**
   * 取消注册物品
   */
  function unregisterItem(itemId: string): void {
    items.value.delete(itemId)
    waitingQueue.value.delete(itemId)

    // 取消正在加载的请求
    const controller = loadingItems.value.get(itemId)
    if (controller) {
      controller.abort()
      loadingItems.value.delete(itemId)
    }
  }

  /**
   * 物品进入视口
   */
  function onItemEnterViewport(item: InventoryItem): void {
    const itemId = getItemId(item)

    // 检查是否已有详情或正在加载
    if (item.detail || loadingItems.value.has(itemId) || loadedItems.value.has(itemId)) {
      return
    }

    // 添加到等待队列
    if (!waitingQueue.value.has(itemId)) {
      waitingQueue.value.set(itemId, {
        item,
        addedAt: Date.now(),
        priority: 0
      })
      stats.value.waitingInQueue = waitingQueue.value.size
    }

    // 非快速滚动时立即尝试加载
    if (!isFastScrolling.value) {
      processNextItem()
    }
  }

  /**
   * 物品离开视口
   */
  function onItemLeaveViewport(item: InventoryItem): void {
    const itemId = getItemId(item)

    // 从等待队列移除
    waitingQueue.value.delete(itemId)
    stats.value.waitingInQueue = waitingQueue.value.size

    // 取消正在加载的请求
    const controller = loadingItems.value.get(itemId)
    if (controller) {
      controller.abort()
      loadingItems.value.delete(itemId)
      item.loading = false
      stats.value.cancelledRequests++
      stats.value.currentlyLoading = loadingItems.value.size
      processNextItem()
    }
  }

  /**
   * 处理下一个物品
   */
  function processNextItem(): void {
    // 快速滚动时不处理
    if (isFastScrolling.value) return

    // 检查并发限制
    if (loadingItems.value.size >= maxConcurrent) return

    // 检查队列
    if (waitingQueue.value.size === 0) return

    // 获取队列中第一个物品
    const [itemId, queueItem] = waitingQueue.value.entries().next().value
    waitingQueue.value.delete(itemId)
    stats.value.waitingInQueue = waitingQueue.value.size

    // 开始加载
    loadItemDetail(queueItem.item)
  }

  /**
   * 加载物品详情
   */
  async function loadItemDetail(item: InventoryItem): Promise<void> {
    if (!fetchFunction) {
      console.error('请先调用 setFetchFunction 设置获取函数')
      return
    }

    const itemId = getItemId(item)

    if (item.detail || loadedItems.value.has(itemId)) return

    const controller = new AbortController()
    loadingItems.value.set(itemId, controller)

    try {
      item.loading = true
      stats.value.totalRequests++
      stats.value.currentlyLoading = loadingItems.value.size

      const detail = await fetchFunction(item, controller.signal)

      item.detail = detail as InventoryItem['detail']
      item.loading = false
      stats.value.successfulRequests++
      loadedItems.value.add(itemId)

      // 停止观察
      stopObservingItem(itemId)
    } catch (error) {
      if ((error as Error).name === 'AbortError' || (error as Error).name === 'CanceledError') {
        stats.value.cancelledRequests++
      } else {
        item.error = (error as Error).message
        stats.value.failedRequests++
      }
      item.loading = false
    } finally {
      loadingItems.value.delete(itemId)
      stats.value.currentlyLoading = loadingItems.value.size
      processNextItem()
    }
  }

  /**
   * 停止观察物品
   */
  function stopObservingItem(itemId: string): void {
    const element = document.querySelector(`[data-item-id="${itemId}"]`)
    if (element && observer) {
      observer.unobserve(element)
    }
  }

  /**
   * 设置 IntersectionObserver
   */
  function setupObserver(): void {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return

    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const itemId = (entry.target as HTMLElement).dataset.itemId
          const item = items.value.get(itemId || '')

          if (!item) return

          if (entry.isIntersecting) {
            onItemEnterViewport(item)
          } else {
            onItemLeaveViewport(item)
          }
        })
      },
      { rootMargin, threshold }
    )
  }

  /**
   * 设置滚动监听
   */
  function setupScrollListener(): void {
    if (typeof window === 'undefined') return

    let lastScrollY = window.scrollY
    let lastTime = Date.now()

    handleScroll = () => {
      const currentTime = Date.now()
      const currentScrollY = window.scrollY

      const timeDiff = currentTime - lastTime
      const scrollDiff = Math.abs(currentScrollY - lastScrollY)
      const scrollSpeed = timeDiff > 0 ? (scrollDiff / timeDiff) * 1000 : 0

      isScrolling.value = true
      isFastScrolling.value = scrollSpeed > fastScrollThreshold

      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }

      scrollTimer = setTimeout(() => {
        isScrolling.value = false
        isFastScrolling.value = false
        processNextItem()
      }, scrollDebounce)

      lastScrollY = currentScrollY
      lastTime = currentTime
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  /**
   * 获取统计信息
   */
  function getStats(): LoadingStats & {
    totalItems: number
    loadedCount: number
    isScrolling: boolean
    isFastScrolling: boolean
    successRate: string
    cancelRate: string
  } {
    return {
      ...stats.value,
      totalItems: items.value.size,
      loadedCount: loadedItems.value.size,
      isScrolling: isScrolling.value,
      isFastScrolling: isFastScrolling.value,
      successRate:
        stats.value.totalRequests > 0
          ? ((stats.value.successfulRequests / stats.value.totalRequests) * 100).toFixed(1) + '%'
          : '0%',
      cancelRate:
        stats.value.totalRequests > 0
          ? ((stats.value.cancelledRequests / stats.value.totalRequests) * 100).toFixed(1) + '%'
          : '0%'
    }
  }

  /**
   * 清理
   */
  function destroy(): void {
    // 移除滚动监听
    if (handleScroll) {
      window.removeEventListener('scroll', handleScroll)
      handleScroll = null
    }

    // 清理定时器
    if (scrollTimer) {
      clearTimeout(scrollTimer)
      scrollTimer = null
    }

    // 断开观察器
    if (observer) {
      observer.disconnect()
      observer = null
    }

    // 取消所有请求
    loadingItems.value.forEach(controller => {
      controller.abort()
    })

    // 清理数据
    items.value.clear()
    loadingItems.value.clear()
    loadedItems.value.clear()
    waitingQueue.value.clear()
  }

  // 生命周期
  onMounted(() => {
    nextTick(() => {
      setupObserver()
      setupScrollListener()
    })
  })

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    // 状态
    items,
    loadingItems,
    loadedItems,
    waitingQueue,
    isScrolling,
    isFastScrolling,

    // 方法
    setFetchFunction,
    registerItem,
    unregisterItem,
    getStats,
    destroy
  }
}

export type UseSmartLoadingReturn = ReturnType<typeof useSmartLoading>
