/*
 * @Author: joker.rrr 
 * @Date: 2025-12-06 21:13:47
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-18 14:41:37
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\utils\item.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * ============================================================================
 * 物品相关工具函数
 * ============================================================================
 */

import type { SteamItem, FilterOption } from '@/api/modules/items';

/**
 * 判断 filters 里是否显示某个购买平台（如 BUFF, YOUPIN）
 * @param filters - 筛选条件数组
 * @returns 平台名称或 undefined
 */
export function getShowBuyPlatform(filters: FilterOption[]): string | undefined {
  const obj = filters.find((f) => f?.filterId === 'showAllBuyPlantform');
  const optionId = obj?.optionIds?.[0];

  if (optionId) {
    const match = optionId.match(/-(.+)$/);
    return match ? match[1] : undefined;
  }
  return optionId;
}

/**
 * 判断 filters 里是否显示某个出售平台（如 MARKET, CSGOBUY）
 * @param filters - 筛选条件数组
 * @returns 平台名称或 undefined
 */
export function getShowSellPlatform(filters: FilterOption[]): string | undefined {
  const obj = filters.find((f) => f?.filterId === 'showAllSellPlantform');
  const optionId = obj?.optionIds?.[0];

  if (optionId) {
    const match = optionId.match(/-(.+)$/);
    return match ? match[1] : undefined;
  }
  return optionId;
}

/**
 * 获取最低平台的在售数量
 * @param item - 物品对象
 * @returns 在售数量或 '-'
 */
export function getMinPlatformVolume(item: SteamItem | null | undefined): string | number {
  if (!item || !item.min_cn_platform) return '-';
  const key = (item.min_cn_platform.toLowerCase() + '_volume') as keyof SteamItem;
  return item[key] ?? '-';
}

/**
 * 获取最低平台的更新时间
 * @param item - 物品对象
 * @returns 更新时间或 '-'
 */
export function getMinPlatformUpdate(item: SteamItem | null | undefined): string | number {
  if (!item || !item.min_cn_platform) return '-';
  const key = ('update_' + item.min_cn_platform.toLowerCase()) as keyof SteamItem;
  return item[key] ?? '-';
}

/**
 * 判断利润是否为负
 * @param profit - 利润值
 * @returns 是否为负
 */
export function isNegativeProfit(profit: string | number | null | undefined): boolean {
  if (profit == null) return false;
  return Number(profit) < 0;
}

/**
 * 判断利润是否为正
 * @param profit - 利润值
 * @returns 是否为正
 */
export function isPositiveProfit(profit: string | number | null | undefined): boolean {
  if (profit == null) return false;
  return Number(profit) > 0;
}
