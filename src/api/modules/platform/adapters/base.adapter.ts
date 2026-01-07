/**
 * 平台适配器基类
 *
 * 职责：只定义 API 接口，不含业务逻辑
 * 所有业务逻辑已迁移到 composables:
 * - useProfitCalculator: 利润计算
 * - useDataNormalizer: 数据标准化
 * - usePriceFormatter: 价格格式化
 * - useInventoryLogic: 筛选/排序/分组/统计
 */

import { PlatformType } from '@/config/platform.config'
import type { InventoryItem } from '@/types/inventory'
import type { SellingItem, SellHistoryItem } from '@/types/selling'
import type {
  IPlatformInventoryAdapter,
  GetInventoryParams,
  InventoryResponse,
  GetItemDetailParams,
  ItemDetailResponse,
  BatchListResult,
  BatchDelistResult
} from './types/inventory.types'
import type {
  IPlatformSellingAdapter,
  GetSellingParams,
  SellingResponse,
  GetSellHistoryParams,
  SellHistoryResponse,
  ListItemResponse,
  DelistItemResponse,
  ChangePriceResponse
} from './types/selling.types'
import type { BatchOperationResult, ListItemParams, DelistItemParams, ChangePriceParams } from '@/types/selling'

/**
 * 获取库存参数（兼容旧接口）
 */
export interface LegacyGetInventoryParams {
  page?: number
  pageSize?: number
  search?: string
  tradableOnly?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 库存响应（兼容旧接口）
 */
export interface LegacyInventoryResponse {
  items: InventoryItem[]
  total: number
  page: number
  pageSize: number
}

/**
 * 平台适配器接口
 *
 * 职责：只定义 API 调用方法
 */
export interface IPlatformAdapter {
  readonly currency: 'CNY' | 'USD'
  readonly supportsExchangeRate: boolean
  readonly defaultExchangeRate?: number

  // API 方法
  getInventory(params?: LegacyGetInventoryParams): Promise<LegacyInventoryResponse | InventoryResponse>
  getSellingItems(params?: LegacyGetInventoryParams): Promise<{ items: SellingItem[]; total: number; success?: boolean }>
  listItem(params: ListItemParams): Promise<{ success: boolean; message?: string }>
  delistItem(params: DelistItemParams): Promise<{ success: boolean; message?: string }>
  getSellHistory(params?: {
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  }): Promise<{ items: SellHistoryItem[]; total: number; success?: boolean }>
  refreshInventory(): Promise<void>
  checkConnection(): Promise<{ connected: boolean; message?: string }>
  changePrice(params: ChangePriceParams): Promise<{ success: boolean; message?: string }>
  batchListItems(items: Array<{ assetId: string; price: number }>): Promise<BatchOperationResult>
  batchDelistItems(assetIds: string[]): Promise<BatchOperationResult>
  getItemDetail?(params: GetItemDetailParams): Promise<ItemDetailResponse>
}

/**
 * 平台适配器基类
 *
 * 职责：只实现 API 调用，不含业务逻辑
 */
export abstract class BasePlatformAdapter
  implements IPlatformAdapter, IPlatformInventoryAdapter, IPlatformSellingAdapter {
  abstract readonly platformName: string
  abstract readonly currency: 'CNY' | 'USD'
  abstract readonly supportsExchangeRate: boolean
  readonly defaultExchangeRate?: number = undefined

  // ============================================================================
  // 库存相关抽象方法 - 纯 API 调用
  // ============================================================================

  abstract getInventory(params?: GetInventoryParams): Promise<InventoryResponse>

  abstract getItemDetail(params: GetItemDetailParams): Promise<ItemDetailResponse>

  // ============================================================================
  // 在售相关抽象方法 - 纯 API 调用
  // ============================================================================

  abstract getSellingItems(params?: GetSellingParams): Promise<SellingResponse>

  abstract getSellHistory(params?: GetSellHistoryParams): Promise<SellHistoryResponse>

  abstract listItem(params: ListItemParams): Promise<ListItemResponse>

  abstract delistItem(params: DelistItemParams): Promise<DelistItemResponse>

  abstract changePrice(params: ChangePriceParams): Promise<ChangePriceResponse>

  abstract refreshInventory(): Promise<void>

  abstract checkConnection(): Promise<{ connected: boolean; message?: string }>

  // ============================================================================
  // 批量操作方法 - 基于单个 API 调用的组合
  // ============================================================================

  async batchList(items: InventoryItem[], price: number): Promise<BatchListResult> {
    const results: BatchListResult['results'] = []

    for (const item of items) {
      try {
        const response = await this.listItem({
          assetId: item.assetId,
          price
        })
        results.push({
          itemId: item.id,
          success: response.success,
          error: response.message
        })
      } catch (error) {
        results.push({
          itemId: item.id,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return {
      success: results.every(r => r.success),
      results
    }
  }

  async batchDelist(items: SellingItem[]): Promise<BatchDelistResult> {
    const results: BatchDelistResult['results'] = []

    for (const item of items) {
      try {
        const response = await this.delistItem({
          assetId: item.assetId
        })
        results.push({
          itemId: item.id,
          success: response.success,
          error: response.message
        })
      } catch (error) {
        results.push({
          itemId: item.id,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return {
      success: results.every(r => r.success),
      results
    }
  }

  async batchListItems(
    items: Array<{ assetId: string; price: number }>
  ): Promise<BatchOperationResult> {
    const errors: BatchOperationResult['errors'] = []
    let successCount = 0

    for (const item of items) {
      try {
        const response = await this.listItem({
          assetId: item.assetId,
          price: item.price
        })
        if (response.success) {
          successCount++
        } else {
          errors.push({
            itemId: item.assetId,
            error: response.message || '上架失败'
          })
        }
      } catch (error) {
        errors.push({
          itemId: item.assetId,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return {
      success: errors.length === 0,
      successCount,
      failedCount: errors.length,
      errors
    }
  }

  async batchDelistItems(assetIds: string[]): Promise<BatchOperationResult> {
    const errors: BatchOperationResult['errors'] = []
    let successCount = 0

    for (const assetId of assetIds) {
      try {
        const response = await this.delistItem({ assetId })
        if (response.success) {
          successCount++
        } else {
          errors.push({
            itemId: assetId,
            error: response.message || '下架失败'
          })
        }
      } catch (error) {
        errors.push({
          itemId: assetId,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return {
      success: errors.length === 0,
      successCount,
      failedCount: errors.length,
      errors
    }
  }
}

// 导出类型
export type { InventoryItem, SellingItem, SellHistoryItem }
