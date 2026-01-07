/*
 * @Author: joker.rrr 
 * @Date: 2025-12-28 00:47:25
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-31 16:36:09
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\common\platform.api.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 获取密钥的 API 路由
 */
export const PLATFORM_API_ROUTES = {
    INVENTORY: '/inventory',
    SELLING: '/selling',
    LIST_ITEM: '/list',
    DELIST_ITEM: '/delist',
    CHANGE_PRICE: '/change-price',
    SELL_HISTORY: '/sell-history',
    ITEM_DETAIL: '/item-detail',
    REFRESH: '/refresh',
    STATUS: 'status'
} as const
