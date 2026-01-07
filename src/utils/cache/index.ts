/**
 * 缓存管理模块
 *
 * 导出缓存管理器和预配置的缓存实例
 */

import { CacheManager, type CacheOptions } from './cache-manager'
import { logger } from '../../utils/logger'
// 导出缓存管理器类和类型
export { CacheManager, type CacheOptions }

// 导出存储工具
export * from './storage'

// ============================================
// 预配置的缓存实例
// ============================================

/**
 * 库存缓存
 * - TTL: 15 分钟
 * - 最大缓存数: 50
 * - 窗口聚焦时刷新
 * - 跨标签页同步
 */
export const inventoryCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 分钟
  maxSize: 50,
  refreshOnFocus: true,
  syncAcrossTabs: true,
  name: 'inventory-cache'
})

/**
 * 物品详情缓存
 * - TTL: 7 天
 * - 最大缓存数: 200
 * - 跨标签页同步
 */
export const itemDetailCache = new CacheManager({
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 天
  maxSize: 200,
  refreshOnFocus: false,
  syncAcrossTabs: true,
  name: 'item-detail-cache'
})

/**
 * API 响应缓存
 * - TTL: 5 分钟
 * - 最大缓存数: 100
 */
export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 分钟
  maxSize: 100,
  refreshOnFocus: false,
  syncAcrossTabs: false,
  name: 'api-cache'
})

/**
 * 用户数据缓存
 * - TTL: 30 分钟
 * - 最大缓存数: 20
 * - 跨标签页同步
 */
export const userCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 分钟
  maxSize: 20,
  refreshOnFocus: false,
  syncAcrossTabs: true,
  name: 'user-cache'
})

/**
 * 价格缓存
 * - TTL: 10 分钟
 * - 最大缓存数: 500
 * - 跨标签页同步
 */
export const priceCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 分钟
  maxSize: 500,
  refreshOnFocus: false,
  syncAcrossTabs: true,
  name: 'price-cache'
})

/**
 * 清理所有缓存
 */
export function clearAllCaches(): void {
  inventoryCache.clear()
  itemDetailCache.clear()
  apiCache.clear()
  userCache.clear()
  priceCache.clear()
  logger.log('[Cache] All caches cleared')
}

/**
 * 销毁所有缓存管理器
 */
export function destroyAllCaches(): void {
  inventoryCache.destroy()
  itemDetailCache.destroy()
  apiCache.destroy()
  userCache.destroy()
  priceCache.destroy()
  logger.log('[Cache] All cache managers destroyed')
}

/**
 * 获取所有缓存统计
 */
export function getAllCacheStats(): Record<string, ReturnType<CacheManager['getStats']>> {
  return {
    inventory: inventoryCache.getStats(),
    itemDetail: itemDetailCache.getStats(),
    api: apiCache.getStats(),
    user: userCache.getStats(),
    price: priceCache.getStats()
  }
}
