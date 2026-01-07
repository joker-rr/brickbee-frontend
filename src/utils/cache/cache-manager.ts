/**
 * LRU 缓存管理器
 *
 * 功能特性:
 * - LRU 淘汰策略
 * - BroadcastChannel 跨标签页通信
 * - 自动过期清理
 * - 窗口聚焦时刷新
 */
import { logger } from '../../utils/logger'
export interface CacheOptions {
  /** 缓存时长（毫秒） */
  ttl: number
  /** 最大缓存数量（LRU） */
  maxSize?: number
  /** 窗口聚焦时刷新 */
  refreshOnFocus?: boolean
  /** 多标签页同步 */
  syncAcrossTabs?: boolean
  /** 缓存名称（用于 BroadcastChannel） */
  name?: string
}

interface CacheItem<T> {
  data: T
  timestamp: number
  accessCount: number
}

/**
 * 生产级缓存管理器
 */
export class CacheManager<T = unknown> {
  private cache = new Map<string, CacheItem<T>>()
  private options: Required<CacheOptions>
  private channel?: BroadcastChannel
  private cleanupTimer?: ReturnType<typeof setInterval>
  private focusHandler?: () => void

  constructor(options: CacheOptions) {
    this.options = {
      maxSize: 100,
      refreshOnFocus: false,
      syncAcrossTabs: false,
      name: 'cache-sync',
      ...options
    }

    this.setupEventListeners()
    this.startCleanupTimer()
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T): void {
    // LRU：超出容量时删除最旧的
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    })

    // 多标签页同步
    if (this.options.syncAcrossTabs) {
      this.broadcastToOtherTabs('set', key, data)
    }
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 检查是否过期
    if (this.isExpired(item)) {
      this.cache.delete(key)
      return null
    }

    // 更新访问计数和时间戳（LRU）
    item.accessCount++
    item.timestamp = Date.now()

    return item.data
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (this.isExpired(item)) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除指定缓存
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)

    // 通知其他标签页
    if (deleted && this.options.syncAcrossTabs) {
      this.broadcastToOtherTabs('delete', key)
    }

    return deleted
  }

  /**
   * 失效指定缓存（别名）
   */
  invalidate(key: string): void {
    this.delete(key)
  }

  /**
   * 失效所有缓存
   */
  invalidateAll(): void {
    this.cache.clear()

    // 通知其他标签页
    if (this.options.syncAcrossTabs) {
      this.broadcastToOtherTabs('clear')
    }

    logger.log('[Cache] Invalidated all cache')
  }

  /**
   * 清空所有缓存（别名）
   */
  clear(): void {
    this.invalidateAll()
  }

  /**
   * 获取或设置缓存（带回调）
   */
  async getOrSet(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data)
    return data
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number
    maxSize: number
    usage: number
    keys: string[]
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      usage: (this.cache.size / this.options.maxSize) * 100,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }

    if (this.channel) {
      this.channel.close()
      this.channel = undefined
    }

    if (this.focusHandler && typeof window !== 'undefined') {
      window.removeEventListener('focus', this.focusHandler)
      this.focusHandler = undefined
    }

    this.cache.clear()
  }

  /**
   * LRU 淘汰：删除最久未访问的
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      logger.log(`[Cache] LRU evicted: ${oldestKey}`)
    }
  }

  /**
   * 检查是否过期
   */
  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > this.options.ttl
  }

  /**
   * 多标签页同步（BroadcastChannel）
   */
  private broadcastToOtherTabs(type: 'set' | 'delete' | 'clear', key?: string, data?: T): void {
    if (typeof window === 'undefined') return

    // 检查 BroadcastChannel 支持
    if (!('BroadcastChannel' in window)) {
      logger.warn('[Cache] BroadcastChannel not supported, falling back to localStorage')
      this.fallbackToLocalStorage(type, key, data)
      return
    }

    // 初始化 channel
    if (!this.channel) {
      this.channel = new BroadcastChannel(this.options.name)
      this.channel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data)
      }
    }

    this.channel.postMessage({ type, key, data })
  }

  /**
   * 处理广播消息
   */
  private handleBroadcastMessage(message: { type: string; key?: string; data?: T }): void {
    const { type, key, data } = message

    switch (type) {
      case 'set':
        if (key && data !== undefined) {
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            accessCount: 0
          })
        }
        break
      case 'delete':
        if (key) {
          this.cache.delete(key)
        }
        break
      case 'clear':
        this.cache.clear()
        break
    }
  }

  /**
   * 降级到 localStorage（兼容旧浏览器）
   */
  private fallbackToLocalStorage(type: 'set' | 'delete' | 'clear', key?: string, data?: T): void {
    if (typeof localStorage === 'undefined') return

    const storageKey = `${this.options.name}:sync`

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        type,
        key,
        data,
        timestamp: Date.now()
      }))
    } catch (e) {
      logger.warn('[Cache] localStorage fallback failed:', e)
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // 窗口聚焦时刷新
    if (this.options.refreshOnFocus) {
      this.focusHandler = () => {
        logger.log('[Cache] Window focused, invalidating all cache')
        this.invalidateAll()
      }
      window.addEventListener('focus', this.focusHandler)
    }

    // 监听 localStorage 变化（降级方案）
    if (this.options.syncAcrossTabs) {
      const hasBroadcastChannel = 'BroadcastChannel' in globalThis
      if (!hasBroadcastChannel) {
        const storageHandler = (event: StorageEvent) => {
          const storageKey = `${this.options.name}:sync`
          if (event.key === storageKey && event.newValue) {
            try {
              const message = JSON.parse(event.newValue) as { type: string; key?: string; data?: T }
              this.handleBroadcastMessage(message)
            } catch (e) {
              logger.warn('[Cache] Failed to parse storage event:', e)
            }
          }
        }
        globalThis.addEventListener?.('storage', storageHandler as EventListener)
      }
    }
  }

  /**
   * 定期清理过期缓存
   */
  private startCleanupTimer(): void {
    // 每分钟清理一次
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      let cleanedCount = 0

      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > this.options.ttl) {
          this.cache.delete(key)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        logger.log(`[Cache] Cleaned ${cleanedCount} expired items`)
      }
    }, 60000)
  }
}
