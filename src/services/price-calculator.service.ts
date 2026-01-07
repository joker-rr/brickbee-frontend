/**
 * 价格计算服务（纯函数）
 */

/**
 * 计算利润
 */
export function calculateProfit(sellPrice: number, costPrice: number): number {
  return sellPrice - costPrice
}

/**
 * 计算利润率
 */
export function calculateProfitRate(sellPrice: number, costPrice: number): number {
  if (costPrice === 0) return 0
  return ((sellPrice - costPrice) / costPrice) * 100
}

/**
 * 批量计算利润和利润率
 */
export function calculateBatch(items: Array<{ sellPrice: number; costPrice: number }>) {
  return items.map((item) => ({
    ...item,
    profit: calculateProfit(item.sellPrice, item.costPrice),
    profitRate: calculateProfitRate(item.sellPrice, item.costPrice)
  }))
}

/**
 * 计算总成本
 */
export function calculateTotalCost(items: Array<{ costPrice: number; quantity?: number }>): number {
  return items.reduce((total, item) => {
    const quantity = item.quantity || 1
    return total + item.costPrice * quantity
  }, 0)
}

/**
 * 计算总售价
 */
export function calculateTotalSellPrice(items: Array<{ sellPrice: number; quantity?: number }>): number {
  return items.reduce((total, item) => {
    const quantity = item.quantity || 1
    return total + item.sellPrice * quantity
  }, 0)
}

/**
 * 计算总利润
 */
export function calculateTotalProfit(items: Array<{ sellPrice: number; costPrice: number; quantity?: number }>): number {
  const totalSellPrice = calculateTotalSellPrice(items)
  const totalCost = calculateTotalCost(items)
  return totalSellPrice - totalCost
}
