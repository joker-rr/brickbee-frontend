/**
 * 在售模块类型定义
 *
 * 包含在售物品、上架、下架等类型
 */

import type { PlatformType } from '@/config/platform.config'
import type { InventoryItem, ItemDetail } from './inventory'

/**
 * 在售物品状态
 */
export type SellingStatus = 'active' | 'pending' | 'sold'

/**
 * 在售物品接口
 */
export interface SellingItem extends InventoryItem {
  /** 上架价格 */
  listPrice: number
  /** 上架时间 */
  listedAt: string
  /** 状态 */
  status: SellingStatus
  /** 订单ID */
  orderId?: string
}

/**
 * 分组在售物品接口
 */
export interface GroupedSellingItems {
  [marketHashName: string]: SellingItem[]
}

/**
 * 上架物品参数
 */
export interface ListItemParams {
  /** 资产ID */
  assetId: string
  /** 上架价格 */
  price: number
  /** 描述 */
  description?: string
}

/**
 * 下架物品参数
 */
export interface DelistItemParams {
  /** 资产ID */
  assetId: string
}

/**
 * 改价参数
 */
export interface ChangePriceParams {
  /** 资产ID */
  assetId: string
  /** 新价格 */
  newPrice: number
}

/**
 * 批量上架参数
 */
export interface BatchListParams {
  /** 物品列表 */
  items: Array<{
    assetId: string
    price: number
  }>
}

/**
 * 批量下架参数
 */
export interface BatchDelistParams {
  /** 资产ID列表 */
  assetIds: string[]
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 是否成功 */
  success: boolean
  /** 成功数量 */
  successCount: number
  /** 失败数量 */
  failedCount: number
  /** 错误详情 */
  errors: Array<{
    itemId: string
    error: string
  }>
}

/**
 * 在售物品统计
 */
export interface SellingStats {
  /** 总数量 */
  totalCount: number
  /** 总价值 */
  totalValue: number
  /** 活跃数量 */
  activeCount: number
  /** 待处理数量 */
  pendingCount: number
  /** 已售数量 */
  soldCount: number
}

/**
 * 销售历史项
 */
export interface SellHistoryItem {
  /** 唯一ID */
  id: string
  /** 资产ID */
  assetId: string
  /** 市场哈希名称 */
  marketHashName: string
  /** 显示名称 */
  name: string
  /** 图片URL */
  imageUrl?: string
  /** 售出价格 */
  sellPrice: number
  /** 成本价 */
  costPrice?: number
  /** 利润 */
  profit?: number
  /** 利润率 */
  profitRate?: number
  /** 售出时间 */
  soldAt: string
  /** 买家名称 */
  buyerName?: string
}

/**
 * 销售历史统计
 */
export interface SellHistoryStats {
  /** 总销售额 */
  totalSales: number
  /** 总利润 */
  totalProfit: number
  /** 平均利润率 */
  averageProfitRate: number
  /** 销售数量 */
  soldCount: number
}

/**
 * 时间筛选范围
 */
export type TimeRange = 'today' | '7days' | '30days' | 'all'

/**
 * 销售历史筛选参数
 */
export interface SellHistoryFilter {
  /** 时间范围 */
  timeRange: TimeRange
  /** 开始日期 */
  startDate?: string
  /** 结束日期 */
  endDate?: string
  /** 搜索关键词 */
  search?: string
}

/**
 * 在售筛选条件
 */
export interface SellingFilter {
  /** 搜索关键词 */
  search?: string
  /** 状态筛选 */
  status?: SellingStatus[]
  /** 价格范围 */
  priceRange?: {
    min?: number
    max?: number
  }
}

/**
 * 在售排序配置
 */
export interface SellingSort {
  /** 排序字段 */
  field: 'name' | 'listPrice' | 'listedAt' | 'status'
  /** 排序方向 */
  order: 'asc' | 'desc'
}
