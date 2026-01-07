/**
 * CSGOBUY 平台适配器
 *
 * 职责：只做 API 调用，不含业务逻辑
 * 所有业务逻辑已迁移到 composables:
 * - useProfitCalculator: 利润计算（公式：价格 × 0.95 × 0.99 - 成本）
 * - useDataNormalizer: 数据标准化
 * - usePriceFormatter: 价格格式化
 *
 * 特点：
 * - 使用 CNY 计价
 * - 不需要汇率计算
 */

import { request } from '@/api/client'
import { PlatformType } from '@/config/platform.config'
import { BasePlatformAdapter } from './base.adapter'
import type {
  GetInventoryParams,
  InventoryResponse,
  GetItemDetailParams,
  ItemDetailResponse
} from './types/inventory.types'
import type {
  GetSellingParams,
  SellingResponse,
  GetSellHistoryParams,
  SellHistoryResponse,
  ListItemResponse,
  DelistItemResponse,
  ChangePriceResponse
} from './types/selling.types'
import type { ListItemParams, DelistItemParams, ChangePriceParams } from '@/types/selling'

/**
 * CSGOBUY API 路由
 */
const CSGOBUY_ROUTES = {
  INVENTORY: '/api/platform/csgobuy/inventory',
  SELLING: '/api/platform/csgobuy/selling',
  LIST_ITEM: '/api/platform/csgobuy/list',
  DELIST_ITEM: '/api/platform/csgobuy/delist',
  CHANGE_PRICE: '/api/platform/csgobuy/change-price',
  SELL_HISTORY: '/api/platform/csgobuy/sell-history',
  ITEM_DETAIL: '/api/platform/csgobuy/item-detail',
  REFRESH: '/api/platform/csgobuy/refresh',
  STATUS: '/api/platform/csgobuy/status'
} as const

/**
 * CSGOBUY 平台适配器实现
 *
 * 职责：只做 API 调用
 */
export class CsgobuyAdapter extends BasePlatformAdapter {
  readonly platform = PlatformType.CSGOBUY
  readonly platformName = 'CSGOBUY'
  readonly currency = 'CNY' as const
  readonly supportsExchangeRate = false

  // ============================================================================
  // 库存相关方法 - 纯 API 调用
  // ============================================================================

  /**
   * 获取库存
   */
  async getInventory(params?: GetInventoryParams): Promise<InventoryResponse> {
    try {
      const response = await request.get<{
        items: Record<string, unknown>[]
        total: number
        page?: number
        pageSize?: number
      }>(CSGOBUY_ROUTES.INVENTORY, {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          search: params?.search,
          tradableOnly: params?.tradableOnly,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          plantForm: this.platform
        },
        signal: params?.signal
      })

      // 返回原始数据，由 composables 处理标准化
      return {
        success: true,
        items: response.items as any[],
        total: response.total
      }
    } catch (error) {
      throw new Error(
        `获取CSGOBUY库存失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 获取物品详情
   */
  async getItemDetail(params: GetItemDetailParams): Promise<ItemDetailResponse> {
    try {
      const response = await request.get<{
        success: boolean
        data: Record<string, unknown>
      }>(CSGOBUY_ROUTES.ITEM_DETAIL, {
        params: {
          classid: params.classId,
          instanceid: params.instanceId,
          plantForm: this.platform
        },
        signal: params.signal
      })

      // 返回原始数据，由 composables 处理标准化
      return {
        success: response.success,
        data: response.data as any
      }
    } catch (error) {
      throw new Error(
        `获取物品详情失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  // ============================================================================
  // 在售相关方法 - 纯 API 调用
  // ============================================================================

  /**
   * 获取在售物品
   */
  async getSellingItems(params?: GetSellingParams): Promise<SellingResponse> {
    try {
      const response = await request.get<{
        items: Record<string, unknown>[]
        total: number
      }>(CSGOBUY_ROUTES.SELLING, {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          search: params?.search,
          status: params?.status,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          plantForm: this.platform
        },
        signal: params?.signal
      })

      // 返回原始数据，由 composables 处理标准化
      return {
        success: true,
        items: response.items as any[],
        total: response.total
      }
    } catch (error) {
      throw new Error(
        `获取CSGOBUY在售物品失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 获取销售历史
   */
  async getSellHistory(params?: GetSellHistoryParams): Promise<SellHistoryResponse> {
    try {
      const response = await request.get<{
        items: Record<string, unknown>[]
        total: number
      }>(CSGOBUY_ROUTES.SELL_HISTORY, {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          startDate: params?.startDate,
          endDate: params?.endDate,
          search: params?.search,
          plantForm: this.platform
        },
        signal: params?.signal
      })

      // 返回原始数据，由 composables 处理标准化
      return {
        success: true,
        items: response.items as any[],
        total: response.total
      }
    } catch (error) {
      throw new Error(
        `获取CSGOBUY销售历史失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 上架物品
   */
  async listItem(params: ListItemParams): Promise<ListItemResponse> {
    try {
      const response = await request.post<{
        success: boolean
        message?: string
        orderId?: string
      }>(CSGOBUY_ROUTES.LIST_ITEM, {
        assetId: params.assetId,
        price: params.price,
        description: params.description,
        plantForm: this.platform
      })

      return response
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '上架失败'
      }
    }
  }

  /**
   * 下架物品
   */
  async delistItem(params: DelistItemParams): Promise<DelistItemResponse> {
    try {
      const response = await request.post<{
        success: boolean
        message?: string
      }>(CSGOBUY_ROUTES.DELIST_ITEM, {
        assetId: params.assetId,
        plantForm: this.platform
      })

      return response
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '下架失败'
      }
    }
  }

  /**
   * 改价
   */
  async changePrice(params: ChangePriceParams): Promise<ChangePriceResponse> {
    try {
      const response = await request.post<{
        success: boolean
        message?: string
      }>(CSGOBUY_ROUTES.CHANGE_PRICE, {
        assetId: params.assetId,
        newPrice: params.newPrice,
        plantForm: this.platform
      })

      return response
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '改价失败'
      }
    }
  }

  /**
   * 刷新库存
   */
  async refreshInventory(): Promise<void> {
    await request.post(CSGOBUY_ROUTES.REFRESH, {
      plantForm: this.platform
    })
  }

  /**
   * 检查连接状态
   */
  async checkConnection(): Promise<{ connected: boolean; message?: string }> {
    try {
      const response = await request.get<{
        connected: boolean
        message?: string
      }>(CSGOBUY_ROUTES.STATUS, {
        params: { plantForm: this.platform }
      })
      return response
    } catch {
      return { connected: false, message: '无法连接到 CSGOBUY 平台' }
    }
  }
}

// 导出单例
export const csgobuyAdapter = new CsgobuyAdapter()
