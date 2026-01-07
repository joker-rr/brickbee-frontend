/*
 * @Author: joker.rrr
 * @Date: 2025-12-02
 * @LastEditors: joker.rrr
 * @LastEditTime: 2025-12-09
 * @FilePath: \brickbee-frontend-ts\src\api\modules\platform\routes.ts
 * @Description: 平台相关路由路径
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

/**
 * 平台相关路由路径
 *
 * 路径前缀：/api/platform
 */
export const PLATFORM_ROUTES = {
  /** GET /api/platform/inventory - 获取库存 */
  INVENTORY: '/inventory',

  /** GET /api/platform/selling - 获取在售商品 */
  SELLING: '/selling'
} as const

/**
 * API 密码管理路由路径
 *
 * 路径前缀：/api/api-password
 */
export const API_PASSWORD_ROUTES = {
  /** GET /api/api-password/ - 获取 API 密码列表 */
  LIST: '/',

  /** POST /api/api-password/ - 创建 API 密码 */
  CREATE: '/',

  /** PUT /api/api-password/:id - 更新 API 密码 */
  UPDATE: '/:id',

  /** DELETE /api/api-password/:id - 删除 API 密码 */
  DELETE: '/:id',

  /** POST /api/api-password/verify-master-key - 验证主密钥 */
  VERIFY_MASTER_KEY: '/verify-master-key'
} as const

/**
 * 销售历史路由路径
 *
 * 路径前缀：/api/sell-history
 */
export const SELL_HISTORY_ROUTES = {
  /** GET /api/sell-history/ - 获取销售历史列表 */
  LIST: '/',

  /** POST /api/sell-history/sync - 同步销售历史 */
  SYNC: '/sync'
} as const

/**
 * 销售历史详情路由路径
 *
 * 路径前缀：/api/sell-history-details
 */
export const SELL_HISTORY_DETAILS_ROUTES = {
  /** POST /api/sell-history-details/batch-update - 批量更新销售历史详情 */
  BATCH_UPDATE: '/batch-update'
} as const
