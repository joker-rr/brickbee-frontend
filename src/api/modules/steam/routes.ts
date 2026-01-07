/*
 * @Author: joker.rrr
 * @Date: 2025-12-02
 * @LastEditors: joker.rrr
 * @LastEditTime: 2025-12-09
 * @FilePath: \brickbee-frontend-ts\src\api\modules\steam\routes.ts
 * @Description: Steam 相关路由路径
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

/**
 * Steam 相关路由路径
 *
 * 路径前缀：/api/steam
 */
export const STEAM_ROUTES = {
  /** GET /api/steam/auth - 生成 Steam 认证 URL（需要登录） */
  AUTH: '/auth',

  /** GET /api/steam/verify - Steam 认证回调验证 */
  VERIFY: '/verify',

  /** GET /api/steam/account - 获取用户 Steam 账户信息（需要登录） */
  ACCOUNT: '/account',

  /** DELETE /api/steam/account - 解绑 Steam 账户（需要登录） */
  UNLINK_ACCOUNT: '/account',

  /** POST /api/steam/callback - 处理第三方平台的 Steam 回调 */
  CALLBACK: '/callback'
} as const
