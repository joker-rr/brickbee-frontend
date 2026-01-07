/**
 * 库存适配器类型定义
 *
 * 职责：只定义 API 相关类型，不含业务逻辑方法
 * 业务逻辑方法已迁移到 composables:
 * - useProfitCalculator: calculateProfit
 * - useDataNormalizer: normalizeInventoryItem, normalizeItemDetail, groupByMarketHashName
 * - usePriceFormatter: formatPrice, normalizePrice
 */

import type { PlatformType } from '@/config/platform.config'
import type {
  InventoryItem,
  ItemDetail,
  GroupedItems
} from '@/types/inventory'
import type { SellingItem } from '@/types/selling'
import type { RequestConfig, PaginationParams } from './common.types'

/**
 * 获取库存参数
 */
export interface GetInventoryParams extends PaginationParams, RequestConfig {
  /** 搜索关键词 */
  search?: string
  /** 是否只显示可交易物品 */
  tradableOnly?: boolean
  /** 排序字段 */
  sortBy?: 'name' | 'price' | 'time'
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'

  executionToken?: string
}

/**
 * 库存响应接口
 */
export interface InventoryResponse {
  /** 是否成功 */
  success: boolean
  /** 物品列表 */
  items: InventoryItem[]
  /** 总数量 */
  total: number
  /** 原始物品数据（用于后续详情加载） */
  rawItems?: InventoryItem[]
  /** 分组数据 */
  groupedItems?: GroupedItems
}

/**
 * 物品详情请求参数
 */
export interface GetItemDetailParams extends RequestConfig {
  /** 类别ID */
  classId: string
  /** 实例ID */
  instanceId: string
}

/**
 * 物品详情响应
 */
export interface ItemDetailResponse {
  /** 是否成功 */
  success: boolean
  /** 详情数据 */
  data: ItemDetail
}

/**
 * 批量上架结果
 */
export interface BatchListResult {
  success: boolean
  results: Array<{
    itemId: string
    success: boolean
    error?: string
  }>
}

/**
 * 批量下架结果
 */
export interface BatchDelistResult {
  success: boolean
  results: Array<{
    itemId: string
    success: boolean
    error?: string
  }>
}

/**
 * 平台库存适配器接口
 *
 * 职责：只定义 API 调用方法
 */
export interface IPlatformInventoryAdapter {

  /** 货币类型 */
  readonly currency: 'CNY' | 'USD'

  /** 是否支持汇率 */
  readonly supportsExchangeRate: boolean

  /** 默认汇率（仅MARKET） */
  readonly defaultExchangeRate?: number

  /**
   * 获取库存
   */
  getInventory(params?: GetInventoryParams): Promise<InventoryResponse>

  /**
   * 获取物品详情
   */
  getItemDetail(params: GetItemDetailParams): Promise<ItemDetailResponse>

  /**
   * 批量上架
   */
  batchList(
    items: InventoryItem[],
    price: number
  ): Promise<BatchListResult>

  /**
   * 批量下架
   */
  batchDelist(items: SellingItem[]): Promise<BatchDelistResult>
}
