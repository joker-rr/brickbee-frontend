/**
 * localStorage 缓存封装
 *
 * 提供带过期时间的 localStorage 缓存功能
 */

import { logger } from '@/utils/logger'

/**
 * 缓存项结构
 */
interface StorageCacheItem<T> {
  data: T
  timestamp: number
  expireAt: number
}

/**
 * 缓存配置
 */
export interface StorageCacheOptions {
  /** 缓存键前缀 */
  prefix?: string
  /** 默认过期时间（毫秒） */
  defaultTTL?: number
}

/**
 * localStorage 缓存管理器
 */
export class StorageCache<T = unknown> {
  private prefix: string
  private defaultTTL: number

  constructor(options: StorageCacheOptions = {}) {
    this.prefix = options.prefix || 'cache_'
    this.defaultTTL = options.defaultTTL || 10 * 60 * 1000 // 默认10分钟
  }

  /**
   * 生成完整的缓存键
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    try {
      const fullKey = this.getKey(key)
      const now = Date.now()
      const expireAt = now + (ttl || this.defaultTTL)

      const item: StorageCacheItem<T> = {
        data,
        timestamp: now,
        expireAt
      }

      localStorage.setItem(fullKey, JSON.stringify(item))
      logger.log(`[StorageCache] Set: ${key}`)
    } catch (error) {
      logger.warn('[StorageCache] Set failed:', error)
      // 存储空间满时清理过期缓存
      this.cleanup()
    }
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    try {
      const fullKey = this.getKey(key)
      const raw = localStorage.getItem(fullKey)

      if (!raw) return null

      const item: StorageCacheItem<T> = JSON.parse(raw)

      // 检查是否过期
      if (Date.now() > item.expireAt) {
        this.delete(key)
        return null
      }

      logger.log(`[StorageCache] Hit: ${key}`)
      return item.data
    } catch (error) {
      logger.warn('[StorageCache] Get failed:', error)
      return null
    }
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    const fullKey = this.getKey(key)
    localStorage.removeItem(fullKey)
    logger.log(`[StorageCache] Delete: ${key}`)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const keys: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key)
      }
    }

    keys.forEach(key => localStorage.removeItem(key))
    logger.log(`[StorageCache] Cleared ${keys.length} items`)
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now()
    const keys: string[] = []
    let cleanedCount = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key)
      }
    }

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const item: StorageCacheItem<T> = JSON.parse(raw)
          if (now > item.expireAt) {
            localStorage.removeItem(key)
            cleanedCount++
          }
        }
      } catch {
        // 解析失败的也删除
        localStorage.removeItem(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.log(`[StorageCache] Cleaned ${cleanedCount} expired items`)
    }

    return cleanedCount
  }

  /**
   * 获取或设置缓存
   */
  async getOrSet(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  /**
   * 更新缓存（不改变过期时间）
   */
  update(key: string, updater: (data: T | null) => T): void {
    const fullKey = this.getKey(key)
    const raw = localStorage.getItem(fullKey)

    if (!raw) {
      this.set(key, updater(null))
      return
    }

    try {
      const item: StorageCacheItem<T> = JSON.parse(raw)

      // 检查是否过期
      if (Date.now() > item.expireAt) {
        this.set(key, updater(null))
        return
      }

      item.data = updater(item.data)
      localStorage.setItem(fullKey, JSON.stringify(item))
    } catch (error) {
      logger.warn('[StorageCache] Update failed:', error)
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    count: number
    keys: string[]
    totalSize: number
  } {
    const keys: string[] = []
    let totalSize = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
        const raw = localStorage.getItem(key)
        if (raw) {
          totalSize += raw.length * 2 // UTF-16
        }
      }
    }

    return {
      count: keys.length,
      keys,
      totalSize
    }
  }
}

// 导出默认实例
export const storageCache = new StorageCache({
  prefix: 'brickbee_',
  defaultTTL: 10 * 60 * 1000 // 10分钟
})
