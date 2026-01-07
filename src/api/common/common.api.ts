/*
 * @Author: joker.rrr 
 * @Date: 2025-11-12 16:00:30
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-31 16:46:09
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\common\common.api.ts
 * @Description: API 路由前缀配置
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */


/**
 * API 路由前缀配置
 * 
 * 如果需要改 API 前缀，只需要改这个文件
 */

export const API_PREFIX = {
    /**
     * 主 API 前缀
     * 
     * 可选值：
     * - '/api'          默认
     * - '/v1'           版本控制
     * - '/backend'      自定义
     * - ''              无前缀
     */
    BASEURL: '/api',

    // 各个模块的前缀
    HEALTH: '/health',
    DB_TEST: '/db-test',
    AUTH: '/auth',
    STEAM: '/steam',
    ITEMS: '/items',

    // 执行会话相关
    EXECUTION_SESSIONS: '/execution-sessions',
    PROXY: '/proxy',
    //获取加密内容
    APIKEYS: '/apikeys',
    SECURITYKEY: '/security',
    //PLATFORM_API
    PLATFORM_API: '/passwords',
    // 获取 库存、在售、等信息。
    PLATFORM: '/platform'
    // ... 后续添加更多
};
