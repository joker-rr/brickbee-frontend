/**
 * BUFF 平台适配器
 *
 * 职责：只做 API 调用，不含业务逻辑
 * 所有业务逻辑已迁移到 composables:
 * - useProfitCalculator: 利润计算（公式：价格 × 0.975 - 成本）
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
import type { ItemDetail } from '@/types/inventory'
import type {
  GetInventoryParams,
  InventoryResponse,
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
 * BUFF API 路由
 */
const BUFF_ROUTES = {
  INVENTORY: '/api/platform/buff/inventory',
  SELLING: '/api/platform/buff/selling',
  LIST_ITEM: '/api/platform/buff/list',
  DELIST_ITEM: '/api/platform/buff/delist',
  SELL_HISTORY: '/api/platform/buff/sell-history',
  REFRESH: '/api/platform/buff/refresh',
  STATUS: '/api/platform/buff/status'
} as const

/**
 * BUFF 平台适配器实现
 *
 * 职责：只做 API 调用
 */
export class BuffAdapter extends BasePlatformAdapter {
  readonly platform = PlatformType.BUFF
  readonly platformName = 'BUFF'
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
      }>(BUFF_ROUTES.INVENTORY, {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          search: params?.search,
          tradableOnly: params?.tradableOnly,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          plantForm: this.platform
        }
      })

      // 返回原始数据，由 composables 处理标准化
      return {
        success: true,
        items: response.items as any[],
        total: response.total
      }
    } catch (error) {
      throw new Error(
        `获取BUFF库存失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 获取物品详情
   * BUFF 暂不支持物品详情
   */
  async getItemDetail(_params: { classId: string; instanceId: string }): Promise<ItemDetailResponse> {
    return {
      success: false,
      data: {
        image: '',
        marketName: '',
        rarity: { rarity: '', rarityZh: '' },
        seo: { seoCategoryZh: '' }
      } as ItemDetail
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
      }>(BUFF_ROUTES.SELLING, {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          plantForm: this.platform
        }
      })

      // 返回原始数据，由 composables 处理标准化
      return {
        success: true,
        items: response.items as any[],
        total: response.total
      }
    } catch (error) {
      throw new Error(
        `获取BUFF在售物品失败: ${error instanceof Error ? error.message : '未知错误'}`
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
      }>(BUFF_ROUTES.SELL_HISTORY, {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          startDate: params?.startDate,
          endDate: params?.endDate,
          plantForm: this.platform
        }
      })

      // 返回原始数据，由 composables 处理标准化
      return {
        success: true,
        items: response.items as any[],
        total: response.total
      }
    } catch (error) {
      throw new Error(
        `获取BUFF销售历史失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 上架物品
   */
  async listItem(params: ListItemParams): Promise<ListItemResponse> {
    try {
      const response = await request.post<{ success: boolean; message?: string }>(
        BUFF_ROUTES.LIST_ITEM,
        {
          assetId: params.assetId,
          price: params.price,
          description: params.description,
          plantForm: this.platform
        }
      )

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
      const response = await request.post<{ success: boolean; message?: string }>(
        BUFF_ROUTES.DELIST_ITEM,
        {
          assetId: params.assetId,
          plantForm: this.platform
        }
      )

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
   * BUFF 暂不支持改价
   */
  async changePrice(_params: ChangePriceParams): Promise<ChangePriceResponse> {
    return { success: false, message: 'BUFF 平台暂不支持改价功能' }
  }

  /**
   * 刷新库存
   */
  async refreshInventory(): Promise<void> {
    await request.post(BUFF_ROUTES.REFRESH, {
      plantForm: this.platform
    })
  }

  /**
   * 检查连接状态
   */
  async checkConnection(): Promise<{ connected: boolean; message?: string }> {
    try {
      const response = await request.get<{ connected: boolean; message?: string }>(
        BUFF_ROUTES.STATUS,
        {
          params: { plantForm: this.platform }
        }
      )
      return response
    } catch {
      return { connected: false, message: '无法连接到 BUFF 平台' }
    }
  }
}

// 导出单例
export const buffAdapter = new BuffAdapter()
