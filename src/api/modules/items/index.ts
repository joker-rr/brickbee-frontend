/*
 * @Author: joker.rrr 
 * @Date: 2025-12-09 17:03:15
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-28 00:42:54
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\modules\items\index.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * ============================================================================
 * 文件名：index.ts
 * 位置：src/api/modules/items/index.ts
 * 作用：定义所有 Steam 物品相关的 API 接口
 * ============================================================================
 */

import { request } from '@/api/client'
import type {
  ItemListParams,
  ItemListResponse,
  ItemDetailParams,
  BatchItemParams,
  SteamItem
} from './types'
import { API_PREFIX, ITEMS_ROUTES } from '../../common'
/**
 * Steam 物品相关 API
 */
export const itemsApi = {
  /**
   * 获取物品列表（支持筛选、分页）
   *
   * @param params - 查询参数
   * @returns 物品列表和总数
   *
   * 使用示例：
   * const result = await itemsApi.getList({
   *   start: 0,
   *   pageSize: 30,
   *   filters: [
   *     { filterId: 'seo', optionId: 'Rifle' },
   *     { filterId: 'rarity', optionId: '5' },
   *   ],
   * });
   * logger.log(result.list);  // 物品数组
   * logger.log(result.total); // 总数量
   */
  getList: (params?: ItemListParams) =>
    request.post<ItemListResponse>(`${API_PREFIX.ITEMS}`, params, {
      needToken: true,
      showLoading: false
    }),

  /**
   * 获取单个物品详情
   *
   * @param params - 物品参数
   * @returns 物品详细信息
   *
   * 使用示例：
   * const item = await itemsApi.getDetail({
   *   market_hash_name: 'AK-47 | Redline (Field-Tested)',
   * });
   */
  getDetail: (params: ItemDetailParams) =>
    request.get<SteamItem>('/steam-item/single', {
      params,
      needToken: false,
      showLoading: false
    }),

  /**
   * 批量查询物品信息
   *
   * @param params - 批量查询参数
   * @returns 物品数组
   *
   * 使用示例：
   * const items = await itemsApi.getBatch({
   *   market_hash_names: [
   *     'AK-47 | Redline (Field-Tested)',
   *     'AWP | Asiimov (Field-Tested)',
   *   ],
   * });
   */
  getBatch: (params: BatchItemParams) =>
    request.post<SteamItem[]>('/steam-item/batch', params, {
      needToken: false,
      showLoading: false
    })
}

// 导出类型
export * from './types'
