/*
 * @Author: joker.rrr 
 * @Date: 2025-12-01 13:54:03
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-12 15:11:53
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\utils\http\index.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * ============================================================================
 * 文件名：index.ts
 * 位置：src/utils/http/index.ts
 * 作用：HTTP 工具的入口文件，创建并导出 http 实例
 * 为什么需要：全局只用一个 http 实例，统一配置
 * ============================================================================
 */




export { TokenManager, tokenManager } from './tokenManager';
export { LoadingManager } from './loadingManager';
export { ErrorHandler } from './errorHandler';
export * from './types';

/**
 * ============================================================================
 * 使用说明
 * ============================================================================
 * 
 * 1. 在 API 文件中导入：
 *    import http from '@/utils/http';
 * 
 * 2. 发起请求：
 *    const data = await http.get('/users');
 *    const result = await http.post('/auth/login', { username, password });
 * 
 * 3. 自定义配置：
 *    const data = await http.get('/data', {
 *      showLoading: false,  // 不显示 Loading
 *      needToken: false,    // 不需要 Token
 *    });
 * 
 * ============================================================================
 */