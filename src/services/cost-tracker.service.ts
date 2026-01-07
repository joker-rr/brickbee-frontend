/**
 * 成本追踪服务（纯函数）
 *
 * 用于追踪和管理物品成本
 */

/**
 * 成本记录
 */
export interface CostRecord {
  /** 物品 ID */
  itemId: string
  /** 成本价格 */
  costPrice: number
  /** 购买时间 */
  purchaseDate: string
  /** 购买平台 */
  platform?: string
  /** 备注 */
  note?: string
}

/**
 * 成本统计
 */
export interface CostStats {
  /** 总成本 */
  totalCost: number
  /** 平均成本 */
  averageCost: number
  /** 最高成本 */
  maxCost: number
  /** 最低成本 */
  minCost: number
  /** 物品数量 */
  itemCount: number
}

/**
 * 计算成本统计
 */
export function calculateCostStats(records: CostRecord[]): CostStats {
  if (records.length === 0) {
    return {
      totalCost: 0,
      averageCost: 0,
      maxCost: 0,
      minCost: 0,
      itemCount: 0
    }
  }

  const costs = records.map((r) => r.costPrice)
  const totalCost = costs.reduce((sum, cost) => sum + cost, 0)

  return {
    totalCost,
    averageCost: totalCost / costs.length,
    maxCost: Math.max(...costs),
    minCost: Math.min(...costs),
    itemCount: records.length
  }
}

/**
 * 按平台分组成本
 */
export function groupCostByPlatform(
  records: CostRecord[]
): Record<string, CostStats> {
  const groups: Record<string, CostRecord[]> = {}

  records.forEach((record) => {
    const platform = record.platform || 'unknown'
    if (!groups[platform]) {
      groups[platform] = []
    }
    groups[platform].push(record)
  })

  const result: Record<string, CostStats> = {}
  Object.entries(groups).forEach(([platform, platformRecords]) => {
    result[platform] = calculateCostStats(platformRecords)
  })

  return result
}

/**
 * 按时间段分组成本
 */
export function groupCostByPeriod(
  records: CostRecord[],
  period: 'day' | 'week' | 'month' | 'year'
): Record<string, CostStats> {
  const groups: Record<string, CostRecord[]> = {}

  records.forEach((record) => {
    const date = new Date(record.purchaseDate)
    let key: string

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0] ?? ''
        break
      case 'week': {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0] ?? ''
        break
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'year':
        key = String(date.getFullYear())
        break
    }

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key]!.push(record)
  })

  const result: Record<string, CostStats> = {}
  Object.entries(groups).forEach(([key, periodRecords]) => {
    result[key] = calculateCostStats(periodRecords)
  })

  return result
}

/**
 * 计算成本趋势（与上期对比）
 */
export function calculateCostTrend(
  currentStats: CostStats,
  previousStats: CostStats
): {
  totalCostChange: number
  totalCostChangeRate: number
  averageCostChange: number
  averageCostChangeRate: number
} {
  const totalCostChange = currentStats.totalCost - previousStats.totalCost
  const totalCostChangeRate = previousStats.totalCost === 0
    ? 0
    : (totalCostChange / previousStats.totalCost) * 100

  const averageCostChange = currentStats.averageCost - previousStats.averageCost
  const averageCostChangeRate = previousStats.averageCost === 0
    ? 0
    : (averageCostChange / previousStats.averageCost) * 100

  return {
    totalCostChange,
    totalCostChangeRate,
    averageCostChange,
    averageCostChangeRate
  }
}

/**
 * 查找成本异常（超出平均值的物品）
 */
export function findCostAnomalies(
  records: CostRecord[],
  threshold: number = 2 // 标准差倍数
): CostRecord[] {
  if (records.length < 2) return []

  const costs = records.map((r) => r.costPrice)
  const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length

  // 计算标准差
  const squaredDiffs = costs.map((cost) => Math.pow(cost - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / costs.length
  const stdDev = Math.sqrt(avgSquaredDiff)

  // 查找异常
  const lowerBound = mean - threshold * stdDev
  const upperBound = mean + threshold * stdDev

  return records.filter((record) => {
    return record.costPrice < lowerBound || record.costPrice > upperBound
  })
}

/**
 * 估算补货成本
 */
export function estimateRestockCost(
  records: CostRecord[],
  quantity: number,
  priceInflation: number = 0 // 预期涨幅百分比
): {
  estimatedCost: number
  basedOnAverageCost: number
  inflationAmount: number
} {
  const stats = calculateCostStats(records)
  const basedOnAverageCost = stats.averageCost * quantity
  const inflationAmount = basedOnAverageCost * (priceInflation / 100)

  return {
    estimatedCost: basedOnAverageCost + inflationAmount,
    basedOnAverageCost,
    inflationAmount
  }
}
