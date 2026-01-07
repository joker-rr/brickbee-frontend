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


import { API_PREFIX, PLATFORM_API_ROUTES } from '../../../common'




/**
 * 全平台 平台适配器实现
 *
 * 职责：只做 API 调用
 */
export class Adapter extends BasePlatformAdapter {
    readonly platformName = 'Platform'
    readonly currency = 'USD' as const
    readonly supportsExchangeRate = true
    readonly defaultExchangeRate = 7

    // ============================================================================
    // 库存相关方法 - 纯 API 调用
    // ============================================================================

    /**
     * 获取库存
     */
    async getInventory(data?: GetInventoryParams): Promise<InventoryResponse> {
        try {
            const response = await request.post<{
                items: Record<string, unknown>[]
                total: number
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.INVENTORY}`, {
                ...data,
                signal: data?.signal
            }, {
                headers: {
                    'X-Execution-Token': data.executionToken
                },
                needToken: true,
                showLoading: false
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
    async getItemDetail(data: GetItemDetailParams): Promise<ItemDetailResponse> {
        try {
            const response = await request.get<{
                success: boolean
                data: Record<string, unknown>
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.ITEM_DETAIL}`, {
                ...data,
                signal: data?.signal
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
    async getSellingItems(data?: GetSellingParams): Promise<SellingResponse> {
        try {
            const response = await request.get<{
                items: Record<string, unknown>[]
                total: number
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.SELLING}`, {
                ...data,
                signal: data?.signal
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
    async getSellHistory(data?: GetSellHistoryParams): Promise<SellHistoryResponse> {
        try {
            const response = await request.get<{
                items: Record<string, unknown>[]
                total: number
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.SELL_HISTORY}`, {
                ...data,
                signal: data?.signal
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
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.LIST_ITEM}`, {
                assetId: params.assetId,
                price: params.price,
                description: params.description,

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
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.DELIST_ITEM}`, {
                assetId: params.assetId,

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
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.CHANGE_PRICE}`, {
                assetId: params.assetId,
                newPrice: params.newPrice,

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
        await request.post(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.REFRESH}`, {

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
            }>(`${API_PREFIX.PLATFORM}${PLATFORM_API_ROUTES.STATUS}`, {

            })
            return response
        } catch {
            return { connected: false, message: '无法连接到 MARKET 平台' }
        }
    }
}

// 导出单例
export const adapter = new Adapter()
