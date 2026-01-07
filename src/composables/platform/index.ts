/*
 * @Author: joker.rrr 
 * @Date: 2025-12-31 14:38:16
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-31 17:03:45
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\composables\platform\index.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * Business Composables 统一导出
 *
 * 架构职责：
 * - Store (Pinia): 只存储数据
 * - Composables: 所有业务逻辑处理
 * - Adapters: 只有 API 路径和请求
 */

// 库存相关
export * from './inventory/useInventory'
export * from './inventory/useInventoryLogic'
export * from './inventory/useInventoryService'
export * from './useItems'

// 利润计算 - 新版本（推荐使用）
export {
  useProfitCalculator,
  useSingleItemProfit,
  useBatchProfit,
  calculateMarketProfit,
  calculateCsgobuyProfit,
  calculateBuffProfit,
  calculatePlatformProfit,
  calculateSimpleProfit,
  calculateProfitRate,
  calculateTotalCost,
  calculateTotalSellPrice,
  calculateTotalProfit,
  PLATFORM_FEES,
  type PlatformFeeConfig,
  type PriceItem,
  type UseProfitCalculatorReturn,
  type UseSingleItemProfitReturn,
  type UseBatchProfitReturn
} from './useProfitCalculator'

// 利润计算 - 旧版本（兼容）
export {
  usePriceCalculator,
  useBatchPriceCalculator,
  useFormatPrice,
  type UsePriceCalculatorReturn,
  type UseBatchPriceCalculatorReturn,
  // 重命名导出避免冲突
  type PriceItem as LegacyPriceItem
} from './usePriceCalculator'

// 价格格式化
export * from './usePriceFormatter'

// 数据标准化
export * from './useDataNormalizer'

// 成本价管理
export * from './useCostPrice'

// 平台适配器
export * from './usePlatformAdapter'
