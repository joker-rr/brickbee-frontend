/**
 * 混合缓存策略
 *
 * 结合内存缓存和 localStorage 缓存，提供高性能的缓存方案：
 * - 内存缓存：快速访问，页面刷新后失效
 * - localStorage 缓存：持久化存储，跨会话保持
 */

import { CacheManager, type CacheOptions } from './cache-manager'
import { StorageCache, type StorageCacheOptions } from './storage-cache'
import { logger } from '@/utils/logger'

/**
 * 混合缓存配置
 */
export interface HybridCacheOptions {
  /** 缓存名称 */
  name: string
  /** 内存缓存过期时间（毫秒） */
  memoryTTL?: number
  /** localStorage 缓存过期时间（毫秒） */
  storageTTL?: number
  /** 最大内存缓存数量 */
  maxMemorySize?: number
  /** 是否启用 localStorage 缓存 */
  enableStorage?: boolean
  /** 是否跨标签页同步 */
  syncAcrossTabs?: boolean
}

/**
 * 混合缓存管理器
 */
export class HybridCache<T = unknown> {
  private name: string
  private memoryCache: CacheManager<T>
  private storageCache: StorageCache<T> | null
  private storageTTL: number

  constructor(options: HybridCacheOptions) {
    this.name = options.name
    this.storageTTL = options.storageTTL || 10 * 60 * 1000 // 默认10分钟

    // 初始化内存缓存
    this.memoryCache = new CacheManager<T>({
      ttl: options.memoryTTL || 5 * 60 * 1000, // 默认5分钟
      maxSize: options.maxMemorySize || 100,
      syncAcrossTabs: options.syncAcrossTabs ?? true,
      name: `${options.name}-memory`
    })

    // 初始化 localStorage 缓存
    this.storageCache = options.enableStorage !== false
      ? new StorageCache<T>({
          prefix: `${options.name}_`,
          defaultTTL: this.storageTTL
        })
      : null
  }

  /**
   * 获取缓存
   * 优先从内存获取，如果没有则从 localStorage 获取
   */
  get(key: string): T | null {
    // 1. 尝试从内存缓存获取
    const memoryData = this.memoryCache.get(key)
    if (memoryData !== null) {
      logger.log(`[HybridCache:${this.name}] Memory hit: ${key}`)
      return memoryData
    }

    // 2. 尝试从 localStorage 获取
    if (this.storageCache) {
      const storageData = this.storageCache.get(key)
      if (storageData !== null) {
        // 回写到内存缓存
        this.memoryCache.set(key, storageData)
        logger.log(`[HybridCache:${this.name}] Storage hit: ${key}`)
        return storageData
      }
    }

    logger.log(`[HybridCache:${this.name}] Miss: ${key}`)
    return null
  }

  /**
   * 设置缓存
   * 同时写入内存和 localStorage
   */
  set(key: string, data: T, storageTTL?: number): void {
    // 写入内存缓存
    this.memoryCache.set(key, data)

    // 写入 localStorage 缓存
    if (this.storageCache) {
      this.storageCache.set(key, data, storageTTL || this.storageTTL)
    }

    logger.log(`[HybridCache:${this.name}] Set: ${key}`)
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.memoryCache.delete(key)
    this.storageCache?.delete(key)
    logger.log(`[HybridCache:${this.name}] Delete: ${key}`)
  }

  /**
   * 失效缓存（别名）
   */
  invalidate(key: string): void {
    this.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear()
    this.storageCache?.clear()
    logger.log(`[HybridCache:${this.name}] Cleared all`)
  }

  /**
   * 失效所有缓存（别名）
   */
  invalidateAll(): void {
    this.clear()
  }

  /**
   * 获取或设置缓存
   */
  async getOrSet(key: string, fetcher: () => Promise<T>, storageTTL?: number): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, storageTTL)
    return data
  }

  /**
   * 刷新缓存
   * 强制重新获取数据
   */
  async refresh(key: string, fetcher: () => Promise<T>, storageTTL?: number): Promise<T> {
    this.delete(key)
    const data = await fetcher()
    this.set(key, data, storageTTL)
    return data
  }

  /**
   * 预热缓存
   * 后台加载数据到缓存
   */
  async warmup(
    entries: Array<{ key: string; fetcher: () => Promise<T> }>,
    storageTTL?: number
  ): Promise<void> {
    await Promise.all(
      entries.map(async ({ key, fetcher }) => {
        if (!this.has(key)) {
          try {
            const data = await fetcher()
            this.set(key, data, storageTTL)
          } catch (error) {
            logger.warn(`[HybridCache:${this.name}] Warmup failed for ${key}:`, error)
          }
        }
      })
    )
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    memory: ReturnType<CacheManager['getStats']>
    storage: ReturnType<StorageCache['getStats']> | null
  } {
    return {
      memory: this.memoryCache.getStats(),
      storage: this.storageCache?.getStats() || null
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.memoryCache.destroy()
    logger.log(`[HybridCache:${this.name}] Destroyed`)
  }
}

// ============================================
// 预配置的混合缓存实例
// ============================================

/**
 * 库存混合缓存
 * - 内存TTL: 5分钟
 * - 存储TTL: 10分钟
 */
export const inventoryHybridCache = new HybridCache({
  name: 'inventory',
  memoryTTL: 5 * 60 * 1000,
  storageTTL: 10 * 60 * 1000,
  maxMemorySize: 50,
  enableStorage: true,
  syncAcrossTabs: true
})

/**
 * 在售物品混合缓存
 * - 内存TTL: 5分钟
 * - 存储TTL: 10分钟
 */
export const sellingHybridCache = new HybridCache({
  name: 'selling',
  memoryTTL: 5 * 60 * 1000,
  storageTTL: 10 * 60 * 1000,
  maxMemorySize: 50,
  enableStorage: true,
  syncAcrossTabs: true
})

/**
 * 物品详情混合缓存
 * - 内存TTL: 30分钟
 * - 存储TTL: 7天
 */
export const itemDetailHybridCache = new HybridCache({
  name: 'item_detail',
  memoryTTL: 30 * 60 * 1000,
  storageTTL: 7 * 24 * 60 * 60 * 1000,
  maxMemorySize: 200,
  enableStorage: true,
  syncAcrossTabs: true
})
