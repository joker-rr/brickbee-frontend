/**
 * 数据转换服务（纯函数）
 */

/**
 * 后端字段映射（处理后端字段名错误）
 */
export function transformApiParams<T extends Record<string, any>>(
  params: T,
  mapping: Record<keyof T, string>
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(params)) {
    const mappedKey = mapping[key as keyof T] || key
    result[mappedKey] = value
  }

  return result
}

/**
 * 转换平台参数（处理后端的 plantForm 拼写错误）
 */
export function transformPlatformParams(params: { platform: string; [key: string]: any }) {
  return {
    ...params,
    plantForm: params.platform, // 后端使用错误的拼写
    platform: undefined // 移除正确的字段名
  }
}

/**
 * 数组去重
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

/**
 * 分组
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key])
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    },
    {} as Record<string, T[]>
  )
}

/**
 * 排序
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[key]
    const bValue = b[key]

    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
}
