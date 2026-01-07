/**
 * MARKET 平台适配器
 *
 * 职责：只做 API 调用，不含业务逻辑
 * 所有业务逻辑已迁移到 composables:
 * - useProfitCalculator: 利润计算（公式：价格 × (汇率-0.04) × 0.95 × 0.95 - 成本）
 * - useDataNormalizer: 数据标准化
 * - usePriceFormatter: 价格格式化
 *
 * 特点：
 * - 使用 USD 计价
 * - 需要汇率计算
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
 * MARKET API 路由
 */
const MARKET_ROUTES = {
  INVENTORY: '/api/platform/market/inventory',
  SELLING: '/api/platform/market/selling',
  LIST_ITEM: '/api/platform/market/list',
  DELIST_ITEM: '/api/platform/market/delist',
  CHANGE_PRICE: '/api/platform/market/change-price',
  SELL_HISTORY: '/api/platform/market/sell-history',
  ITEM_DETAIL: '/api/platform/market/item-detail',
  REFRESH: '/api/platform/market/refresh',
  STATUS: '/api/platform/market/status'
} as const

/**
 * MARKET 平台适配器实现
 *
 * 职责：只做 API 调用
 */
export class MarketAdapter extends BasePlatformAdapter {
  readonly platform = PlatformType.MARKET
  readonly platformName = 'MARKET'
  readonly currency = 'USD' as const
  readonly supportsExchangeRate = true
  readonly defaultExchangeRate = 7

  // ============================================================================
  // 库存相关方法 - 纯 API 调用
  // ============================================================================

  /**
   * 获取库存
   */
  async getInventory(params?: GetInventoryParams): Promise<InventoryResponse> {
    try {
      const response = await request.post<{
        items: Record<string, unknown>[]
        total: number
      }>(MARKET_ROUTES.INVENTORY, {
        params: {
          plantForm: this.platform,
          ...params
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
        `获取MARKET库存失败: ${error instanceof Error ? error.message : '未知错误'}`
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
      }>(MARKET_ROUTES.ITEM_DETAIL, {
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
      }>(MARKET_ROUTES.SELLING, {
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
        `获取MARKET在售物品失败: ${error instanceof Error ? error.message : '未知错误'}`
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
      }>(MARKET_ROUTES.SELL_HISTORY, {
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
        `获取MARKET销售历史失败: ${error instanceof Error ? error.message : '未知错误'}`
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
      }>(MARKET_ROUTES.LIST_ITEM, {
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
      }>(MARKET_ROUTES.DELIST_ITEM, {
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
      }>(MARKET_ROUTES.CHANGE_PRICE, {
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
    await request.post(MARKET_ROUTES.REFRESH, {
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
      }>(MARKET_ROUTES.STATUS, {
        params: { plantForm: this.platform }
      })
      return response
    } catch {
      return { connected: false, message: '无法连接到 MARKET 平台' }
    }
  }
}

// 导出单例
export const marketAdapter = new MarketAdapter()
