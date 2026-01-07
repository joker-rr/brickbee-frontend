/**
 * 在售适配器类型定义
 *
 * 职责：只定义 API 相关类型，不含业务逻辑方法
 * 业务逻辑方法已迁移到 composables:
 * - useDataNormalizer: normalizeSellingItem, normalizeSellHistoryItem
 */

import type { PlatformType } from '@/config/platform.config'
import type {
  SellingItem,
  SellHistoryItem,
  ListItemParams,
  DelistItemParams,
  ChangePriceParams,
  BatchOperationResult
} from '@/types/selling'
import type { RequestConfig, PaginationParams } from './common.types'

/**
 * 获取在售物品参数
 */
export interface GetSellingParams extends PaginationParams, RequestConfig {
  /** 搜索关键词 */
  search?: string
  /** 状态筛选 */
  status?: 'active' | 'pending' | 'sold'
  /** 排序字段 */
  sortBy?: 'name' | 'price' | 'time'
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 在售物品响应
 */
export interface SellingResponse {
  /** 是否成功 */
  success: boolean
  /** 物品列表 */
  items: SellingItem[]
  /** 总数量 */
  total: number
}

/**
 * 获取销售历史参数
 */
export interface GetSellHistoryParams extends PaginationParams, RequestConfig {
  /** 开始日期 */
  startDate?: string
  /** 结束日期 */
  endDate?: string
  /** 搜索关键词 */
  search?: string
}

/**
 * 销售历史响应
 */
export interface SellHistoryResponse {
  /** 是否成功 */
  success: boolean
  /** 历史记录列表 */
  items: SellHistoryItem[]
  /** 总数量 */
  total: number
}

/**
 * 上架物品响应
 */
export interface ListItemResponse {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message?: string
  /** 订单ID */
  orderId?: string
}

/**
 * 下架物品响应
 */
export interface DelistItemResponse {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message?: string
}

/**
 * 改价响应
 */
export interface ChangePriceResponse {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message?: string
}

/**
 * 平台在售适配器接口
 *
 * 职责：只定义 API 调用方法
 */
export interface IPlatformSellingAdapter {

  /**
   * 获取在售物品
   */
  getSellingItems(params?: GetSellingParams): Promise<SellingResponse>

  /**
   * 获取销售历史
   */
  getSellHistory(params?: GetSellHistoryParams): Promise<SellHistoryResponse>

  /**
   * 上架物品
   */
  listItem(params: ListItemParams): Promise<ListItemResponse>

  /**
   * 下架物品
   */
  delistItem(params: DelistItemParams): Promise<DelistItemResponse>

  /**
   * 改价
   */
  changePrice(params: ChangePriceParams): Promise<ChangePriceResponse>

  /**
   * 批量上架
   */
  batchListItems(
    items: Array<{ assetId: string; price: number }>
  ): Promise<BatchOperationResult>

  /**
   * 批量下架
   */
  batchDelistItems(assetIds: string[]): Promise<BatchOperationResult>
}
