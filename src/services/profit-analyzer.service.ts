/**
 * 利润分析服务（纯函数）
 *
 * 用于分析和统计销售利润
 */

import { calculateProfit, calculateProfitRate } from './price-calculator.service'

/**
 * 销售记录
 */
export interface SaleRecord {
  /** 物品 ID */
  itemId: string
  /** 物品名称 */
  itemName: string
  /** 销售价格 */
  sellPrice: number
  /** 成本价格 */
  costPrice: number
  /** 销售时间 */
  soldAt: string
  /** 销售平台 */
  platform?: string
  /** 数量 */
  quantity?: number
}

/**
 * 利润统计
 */
export interface ProfitStats {
  /** 总销售额 */
  totalRevenue: number
  /** 总成本 */
  totalCost: number
  /** 总利润 */
  totalProfit: number
  /** 总利润率 */
  totalProfitRate: number
  /** 平均利润 */
  averageProfit: number
  /** 平均利润率 */
  averageProfitRate: number
  /** 最高利润 */
  maxProfit: number
  /** 最低利润 */
  minProfit: number
  /** 盈利笔数 */
  profitableCount: number
  /** 亏损笔数 */
  lossCount: number
  /** 销售笔数 */
  saleCount: number
  /** 盈利率（盈利笔数/总笔数） */
  winRate: number
}

/**
 * 计算利润统计
 */
export function calculateProfitStats(records: SaleRecord[]): ProfitStats {
  if (records.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalProfitRate: 0,
      averageProfit: 0,
      averageProfitRate: 0,
      maxProfit: 0,
      minProfit: 0,
      profitableCount: 0,
      lossCount: 0,
      saleCount: 0,
      winRate: 0
    }
  }

  const profits = records.map((r) => {
    const quantity = r.quantity || 1
    return {
      revenue: r.sellPrice * quantity,
      cost: r.costPrice * quantity,
      profit: calculateProfit(r.sellPrice, r.costPrice) * quantity,
      profitRate: calculateProfitRate(r.sellPrice, r.costPrice)
    }
  })

  const totalRevenue = profits.reduce((sum, p) => sum + p.revenue, 0)
  const totalCost = profits.reduce((sum, p) => sum + p.cost, 0)
  const totalProfit = totalRevenue - totalCost
  const totalProfitRate = totalCost === 0 ? 0 : (totalProfit / totalCost) * 100

  const profitValues = profits.map((p) => p.profit)
  const profitRates = profits.map((p) => p.profitRate)

  const profitableCount = profits.filter((p) => p.profit > 0).length
  const lossCount = profits.filter((p) => p.profit < 0).length

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    totalProfitRate,
    averageProfit: totalProfit / records.length,
    averageProfitRate: profitRates.reduce((sum, r) => sum + r, 0) / profitRates.length,
    maxProfit: Math.max(...profitValues),
    minProfit: Math.min(...profitValues),
    profitableCount,
    lossCount,
    saleCount: records.length,
    winRate: (profitableCount / records.length) * 100
  }
}

/**
 * 按平台分析利润
 */
export function analyzeProfitByPlatform(
  records: SaleRecord[]
): Record<string, ProfitStats> {
  const groups: Record<string, SaleRecord[]> = {}

  records.forEach((record) => {
    const platform = record.platform || 'unknown'
    if (!groups[platform]) {
      groups[platform] = []
    }
    groups[platform].push(record)
  })

  const result: Record<string, ProfitStats> = {}
  Object.entries(groups).forEach(([platform, platformRecords]) => {
    result[platform] = calculateProfitStats(platformRecords)
  })

  return result
}

/**
 * 按时间段分析利润
 */
export function analyzeProfitByPeriod(
  records: SaleRecord[],
  period: 'day' | 'week' | 'month' | 'year'
): Record<string, ProfitStats> {
  const groups: Record<string, SaleRecord[]> = {}

  records.forEach((record) => {
    const date = new Date(record.soldAt)
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

  const result: Record<string, ProfitStats> = {}
  Object.entries(groups).forEach(([key, periodRecords]) => {
    result[key] = calculateProfitStats(periodRecords)
  })

  return result
}

/**
 * 计算利润趋势（与上期对比）
 */
export function calculateProfitTrend(
  currentStats: ProfitStats,
  previousStats: ProfitStats
): {
  revenueChange: number
  revenueChangeRate: number
  profitChange: number
  profitChangeRate: number
  winRateChange: number
} {
  const revenueChange = currentStats.totalRevenue - previousStats.totalRevenue
  const revenueChangeRate = previousStats.totalRevenue === 0
    ? 0
    : (revenueChange / previousStats.totalRevenue) * 100

  const profitChange = currentStats.totalProfit - previousStats.totalProfit
  const profitChangeRate = previousStats.totalProfit === 0
    ? 0
    : (profitChange / Math.abs(previousStats.totalProfit)) * 100

  const winRateChange = currentStats.winRate - previousStats.winRate

  return {
    revenueChange,
    revenueChangeRate,
    profitChange,
    profitChangeRate,
    winRateChange
  }
}

/**
 * 获取最赚钱的物品
 */
export function getTopProfitableItems(
  records: SaleRecord[],
  limit: number = 10
): Array<SaleRecord & { profit: number; profitRate: number }> {
  return records
    .map((record) => ({
      ...record,
      profit: calculateProfit(record.sellPrice, record.costPrice) * (record.quantity || 1),
      profitRate: calculateProfitRate(record.sellPrice, record.costPrice)
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit)
}

/**
 * 获取亏损最多的物品
 */
export function getTopLossItems(
  records: SaleRecord[],
  limit: number = 10
): Array<SaleRecord & { profit: number; profitRate: number }> {
  return records
    .map((record) => ({
      ...record,
      profit: calculateProfit(record.sellPrice, record.costPrice) * (record.quantity || 1),
      profitRate: calculateProfitRate(record.sellPrice, record.costPrice)
    }))
    .filter((item) => item.profit < 0)
    .sort((a, b) => a.profit - b.profit)
    .slice(0, limit)
}

/**
 * 按物品类型分析利润
 */
export function analyzeProfitByItemType(
  records: SaleRecord[],
  getItemType: (record: SaleRecord) => string
): Record<string, ProfitStats> {
  const groups: Record<string, SaleRecord[]> = {}

  records.forEach((record) => {
    const type = getItemType(record)
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(record)
  })

  const result: Record<string, ProfitStats> = {}
  Object.entries(groups).forEach(([type, typeRecords]) => {
    result[type] = calculateProfitStats(typeRecords)
  })

  return result
}

/**
 * 预测未来利润（基于历史数据的简单线性预测）
 */
export function predictFutureProfit(
  monthlyStats: Record<string, ProfitStats>,
  monthsToPredict: number = 3
): Array<{ month: string; predictedProfit: number }> {
  const months = Object.keys(monthlyStats).sort()
  const profits = months.map((m) => monthlyStats[m]?.totalProfit ?? 0)

  if (profits.length < 2) {
    return []
  }

  // 计算增长率
  const growthRates: number[] = []
  for (let i = 1; i < profits.length; i++) {
    const prevProfit = profits[i - 1]
    const currProfit = profits[i]
    if (prevProfit !== undefined && currProfit !== undefined && prevProfit !== 0) {
      growthRates.push((currProfit - prevProfit) / Math.abs(prevProfit))
    }
  }

  const avgGrowthRate = growthRates.length > 0
    ? growthRates.reduce((sum, r) => sum + r, 0) / growthRates.length
    : 0

  // 预测
  const predictions: Array<{ month: string; predictedProfit: number }> = []
  const lastProfitValue = profits[profits.length - 1]
  const lastMonthKey = months[months.length - 1]

  if (lastProfitValue === undefined || lastMonthKey === undefined) {
    return []
  }

  let lastProfit = lastProfitValue
  const lastMonth = new Date(lastMonthKey + '-01')

  for (let i = 0; i < monthsToPredict; i++) {
    lastMonth.setMonth(lastMonth.getMonth() + 1)
    const predictedProfit = lastProfit * (1 + avgGrowthRate)
    predictions.push({
      month: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
      predictedProfit
    })
    lastProfit = predictedProfit
  }

  return predictions
}
