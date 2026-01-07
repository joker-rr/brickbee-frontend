
import { logger } from '../../utils/logger'
/**
 * 存储工具
 *
 * 提供类型安全�?localStorage/sessionStorage 操作
 */

export type StorageType = 'local' | 'session'

interface StorageOptions {
  /** 存储类型 */
  type?: StorageType
  /** 键前缀 */
  prefix?: string
  /** 过期时间（毫秒） */
  expires?: number
}

interface StorageItem<T> {
  value: T
  timestamp: number
  expires?: number
}

/**
 * 获取存储实例
 */
function getStorage(type: StorageType): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return type === 'local' ? localStorage : sessionStorage
  } catch {
    logger.warn(`[Storage] ${type}Storage is not available`)
    return null
  }
}

/**
 * 设置存储�?
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  options: StorageOptions = {}
): boolean {
  const { type = 'local', prefix = 'bb_', expires } = options
  const storage = getStorage(type)

  if (!storage) return false

  const fullKey = `${prefix}${key}`
  const item: StorageItem<T> = {
    value,
    timestamp: Date.now(),
    expires
  }

  try {
    storage.setItem(fullKey, JSON.stringify(item))
    return true
  } catch (e) {
    logger.error('[Storage] Failed to set item:', e)
    // 存储已满，尝试清理过期数�?
    clearExpiredItems(type, prefix)
    // 再次尝试
    try {
      storage.setItem(fullKey, JSON.stringify(item))
      return true
    } catch {
      return false
    }
  }
}

/**
 * 获取存储�?
 */
export function getStorageItem<T>(
  key: string,
  options: Omit<StorageOptions, 'expires'> = {}
): T | null {
  const { type = 'local', prefix = 'bb_' } = options
  const storage = getStorage(type)

  if (!storage) return null

  const fullKey = `${prefix}${key}`

  try {
    const raw = storage.getItem(fullKey)
    if (!raw) return null

    const item: StorageItem<T> = JSON.parse(raw)

    // 检查是否过�?
    if (item.expires && Date.now() - item.timestamp > item.expires) {
      storage.removeItem(fullKey)
      return null
    }

    return item.value
  } catch {
    return null
  }
}

/**
 * 移除存储�?
 */
export function removeStorageItem(
  key: string,
  options: Omit<StorageOptions, 'expires'> = {}
): boolean {
  const { type = 'local', prefix = 'bb_' } = options
  const storage = getStorage(type)

  if (!storage) return false

  const fullKey = `${prefix}${key}`

  try {
    storage.removeItem(fullKey)
    return true
  } catch {
    return false
  }
}

/**
 * 检查存储项是否存在
 */
export function hasStorageItem(
  key: string,
  options: Omit<StorageOptions, 'expires'> = {}
): boolean {
  return getStorageItem(key, options) !== null
}

/**
 * 清除所有存储项（仅清除带前缀的）
 */
export function clearStorage(options: Omit<StorageOptions, 'expires'> = {}): void {
  const { type = 'local', prefix = 'bb_' } = options
  const storage = getStorage(type)

  if (!storage) return

  const keysToRemove: string[] = []

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key))
}

/**
 * 清理过期的存储项
 */
export function clearExpiredItems(
  type: StorageType = 'local',
  prefix: string = 'bb_'
): number {
  const storage = getStorage(type)
  if (!storage) return 0

  const keysToRemove: string[] = []
  const now = Date.now()

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && key.startsWith(prefix)) {
      try {
        const raw = storage.getItem(key)
        if (raw) {
          const item: StorageItem<unknown> = JSON.parse(raw)
          if (item.expires && now - item.timestamp > item.expires) {
            keysToRemove.push(key)
          }
        }
      } catch {
        // 无效数据，删�?
        keysToRemove.push(key)
      }
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key))
  return keysToRemove.length
}

/**
 * 获取存储使用情况
 */
export function getStorageUsage(type: StorageType = 'local'): {
  used: number
  total: number
  percentage: number
} {
  const storage = getStorage(type)

  if (!storage) {
    return { used: 0, total: 0, percentage: 0 }
  }

  let used = 0
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key) {
      const value = storage.getItem(key)
      if (value) {
        used += key.length + value.length
      }
    }
  }

  // localStorage 通常限制�?5MB
  const total = 5 * 1024 * 1024

  return {
    used,
    total,
    percentage: (used / total) * 100
  }
}

/**
 * 创建存储命名空间
 */
export function createStorageNamespace(namespace: string, type: StorageType = 'local') {
  const prefix = `bb_${namespace}_`

  return {
    get: <T>(key: string) => getStorageItem<T>(key, { type, prefix }),
    set: <T>(key: string, value: T, expires?: number) =>
      setStorageItem(key, value, { type, prefix, expires }),
    remove: (key: string) => removeStorageItem(key, { type, prefix }),
    has: (key: string) => hasStorageItem(key, { type, prefix }),
    clear: () => clearStorage({ type, prefix }),
    clearExpired: () => clearExpiredItems(type, prefix)
  }
}

// 预定义的存储命名空间
export const authStorage = createStorageNamespace('auth')
export const userStorage = createStorageNamespace('user')
export const cacheStorage = createStorageNamespace('cache')
export const settingsStorage = createStorageNamespace('settings')

// 默认存储实例（兼容 useCostPrice 等模块）
export const storage = createStorageNamespace('data')


