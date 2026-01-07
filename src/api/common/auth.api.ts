/*
 * @Author: joker.rrr 
 * @Date: 2025-12-12 14:57:22
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-13 05:06:18
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\common\auth.api.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */



/**
 * 认证相关路由路径
 *
 * 路径前缀：/api/auth
 */
export const AUTH_ROUTES = {
    /** POST /api/auth/login - 用户登录 */
    LOGIN: '/login',

    /** POST /api/auth/register - 用户注册 */
    REGISTER: '/register',

    /** POST /api/auth/send-register-code - 发送注册验证码 */
    SEND_REGISTER_CODE: '/send-register-code',

    /** POST /api/auth/change-password - 修改密码（需要登录） */
    CHANGE_PASSWORD: '/change-password',

    /** POST /api/auth/send-reset-password-code - 发送重置密码验证码 */
    SEND_RESET_PASSWORD_CODE: '/send-reset-password-code',

    /** POST /api/auth/reset-password - 重置密码 */
    RESET_PASSWORD: '/reset-password',

    /** POST /api/auth/refresh-token - 刷新 Token */
    REFRESH_TOKEN: '/refresh-token',

    /** POST /api/auth/logout - 登出（需要登录） */
    LOGOUT: '/logout',

    /** GET /api/auth/info - 查看用户信息（携带refreshToken）或者（需要登录） */
    INFO: '/info'


} as const;
