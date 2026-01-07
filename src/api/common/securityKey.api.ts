/*
 * @Author: joker.rrr 
 * @Date: 2025-12-28 00:47:25
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-28 13:20:51
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\common\securityKey.api.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 获取密钥的 API 路由
 */
export const GET_SECURITY_KEYS_ROUTES = {
    PUBLICKEY: '/publicKey',
    CHALLENGEDID: '/challengeId',
} as const
