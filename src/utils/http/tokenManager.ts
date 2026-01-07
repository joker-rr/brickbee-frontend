/**
 * ============================================================================
 * 文件名：tokenManager.ts
 * 位置：src/utils/http/tokenManager.ts
 * 作用：管理用户的登录 Token
 * 为什么需要：
 *   1. 自动在请求头添加 Token
 *   2. Token 过期时自动刷新
 *   3. 防止多个请求同时刷新 Token
 * ============================================================================
 */

import axios from 'axios';
import type { ApiResponse } from './types';
import { API_PREFIX } from '../../api/common'
import { AUTH_ROUTES } from '../../api/common'
import { logger } from '../logger';

/**
 * Token 管理器类
 */
export class TokenManager {
  // ✅ 修改：accessToken 存在内存中（不用 localStorage）
  private accessToken: string | null = null;

  // private initPromise: Promise<void> | null = null;

  // ✅ 删除：不再需要 refreshToken 相关代码（存在 httpOnly Cookie 里）
  // private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // 是否正在刷新 Token 的标志
  private isRefreshing = false;

  // 等待刷新完成的请求队列
  // 场景：当多个请求同时发现 Token 过期时，只刷新一次
  private refreshSubscribers: ((token: string) => void)[] = [];

  // /**
  //  * ✅ 应用启动时自动初始化
  //  */
  // async init(): Promise<void> {

  //   if (this.initPromise) {
  //     return this.initPromise;
  //   }

  //   this.initPromise = (async () => {
  //     try {
  //       const newToken = await this.refreshToken();
  //       this.setToken(newToken);

  //       logger.log('✅ Token 自动刷新成功');
  //     } catch (error) {
  //       logger.log('ℹ️ 未登录或 Token 已过期');
  //     }
  //   })();

  //   return this.initPromise;
  // }





  // --------------------------------------------------------------------------
  // 1. 获取 Token
  // --------------------------------------------------------------------------

  /**
   * ✅ 修改：从内存获取 Token
   *
   * @returns Token 字符串，如果不存在返回 null
   *
   * 使用场景：
   * const token = tokenManager.getToken();
   * if (token) {
   *   // 用户已登录
   * }
   */
  getToken(): string | null {
    return this.accessToken;
  }

  // --------------------------------------------------------------------------
  // 2. 保存 Token  // 以及本地的 api_key
  // --------------------------------------------------------------------------

  /**
   * ✅ 修改：保存 Token 到内存
   *
   * @param token - Token 字符串
   *
   * 使用场景：
   * // 登录成功后保存 Token
   * tokenManager.setToken(response.data.token);
   */
  setToken(token: string): void {
    this.accessToken = token;
  }

  // --------------------------------------------------------------------------
  // 3. ✅ 删除：不再需要 getRefreshToken 和 setRefreshToken
  //    因为 refreshToken 存在 httpOnly Cookie 里，前端无法访问
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // 4. 清除所有 Token
  // --------------------------------------------------------------------------

  /**
   * ✅ 修改：只清除内存中的 accessToken
   *
   * 使用场景：
   * 1. 用户登出
   * 2. Token 刷新失败
   * 3. Token 无效
   */
  clearTokens(): void {
    this.accessToken = null;
    // refreshToken 在 Cookie 里，后端登出时会清除
  }

  // --------------------------------------------------------------------------
  // 5. 刷新 Token（核心功能）
  // --------------------------------------------------------------------------

  /**
   * ✅ 修改：刷新 Token（使用 httpOnly Cookie）
   *
   * 工作流程：
   * 1. 检查是否正在刷新
   * 2. 如果正在刷新，等待刷新完成
   * 3. 如果没在刷新，发起刷新请求（不传 refreshToken，浏览器自动带 Cookie）
   * 4. 刷新成功，通知所有等待的请求
   * 5. 刷新失败，清除 Token 并跳转登录
   *
   * @returns 新的 accessToken
   */
  async refreshToken(isInit?: boolean): Promise<string> {
    // ========================================
    // 场景说明：
    //
    // 假设同时有 3 个请求都发现 Token 过期：
    //
    // 请求1: 发现过期 → 调用 refreshToken()
    // 请求2: 发现过期 → 调用 refreshToken()  ← 应该等待请求1
    // 请求3: 发现过期 → 调用 refreshToken()  ← 应该等待请求1
    //
    // 我们不希望同时发起 3 次刷新请求，
    // 而是只刷新一次，其他请求等待刷新完成。
    // ========================================

    // 如果正在刷新，返回一个 Promise，等待刷新完成
    if (this.isRefreshing) {
      logger.log('⏳ Token 正在刷新中，当前请求加入等待队列...');

      return new Promise((resolve) => {
        // 把这个请求的 resolve 函数加入队列
        // 当刷新完成时，会调用这个 resolve 函数
        this.refreshSubscribers.push((token: string) => {
          resolve(token);
        });
      });
    }

    // 标记为正在刷新
    this.isRefreshing = true;
    logger.log('🔄 开始刷新 Token...');

    try {
      // ✅ 修改：调用刷新 Token 接口
      // 不传 refreshToken，浏览器会自动带上 httpOnly Cookie
      // 注意：这里直接用 axios，不用我们封装的 http
      // 因为 http 会触发拦截器，可能导致无限循环
      const response = await axios.post<ApiResponse<{
        accessToken: string;
        refreshToken: string;
        user: object;
      }>>(
        `${API_PREFIX.BASEURL}${API_PREFIX.AUTH}${AUTH_ROUTES.REFRESH_TOKEN}`,
        {},  // ✅ 空对象，不传 refreshToken
        {
          withCredentials: true,  // ✅ 重要：允许发送 Cookie
        }
      );

      // 检查响应
      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Token 刷新失败');
      }

      // ✅ 获取返回的数据
      const newToken = response.data.data.accessToken;

      // 保存新的 accessToken 到内存
      this.setToken(newToken);

      logger.log('✅ Token 刷新成功');
      const X = this.getToken()
      logger.log('🔄 开始刷新 Token...', X);
      // 通知所有等待的请求
      // 场景：请求2 和 请求3 在等待，现在告诉它们新 Token 是什么
      this.refreshSubscribers.forEach((callback) => {
        callback(newToken);
      });

      // 清空等待队列
      this.refreshSubscribers = [];

      const user = JSON.stringify(response.data.data.user)
      if (isInit) return user

      return newToken;
    } catch (error) {
      logger.error('❌ Token 刷新失败:', error);

      // 刷新失败，清除所有 Token
      this.clearTokens();

      // 跳转到登录页
      // 注意：保存当前页面路径，登录后可以跳回来
      // const currentPath = window.location.pathname;
      // const loginUrl = '/login';

      // if (currentPath !== loginUrl) {
      //   window.location.href = `${loginUrl}?redirect=${encodeURIComponent(currentPath)}`;
      // }

      throw error;
    } finally {
      // 无论成功还是失败，都要重置刷新标志
      this.isRefreshing = false;
    }

  }
}

// --------------------------------------------------------------------------
// 导出 TokenManager 实例
// --------------------------------------------------------------------------

/**
 * 全局 TokenManager 实例
 * 在整个应用中使用同一个实例来管理 Token
 */
export const tokenManager = new TokenManager();

// --------------------------------------------------------------------------
// 使用示例
// --------------------------------------------------------------------------

/*
// 1. 使用全局 TokenManager 实例
import { tokenManager } from '@/utils/http/tokenManager';

// 2. 登录成功后保存 Token
const handleLogin = async (username: string, password: string) => {
  const response = await http.post('/auth/login', { username, password });
  
  // 保存 Token
  tokenManager.setToken(response.data.token);
  tokenManager.setRefreshToken(response.data.refreshToken);
};

// 3. 在请求拦截器中添加 Token
axios.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. 在响应拦截器中处理 Token 过期
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 如果是 Token 过期错误
    if (error.response?.data?.code === 10001) {
      try {
        // 刷新 Token
        const newToken = await tokenManager.refreshToken();
        
        // 重新发起原来的请求
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios.request(error.config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// 5. 登出时清除 Token
const handleLogout = () => {
  tokenManager.clearTokens();
  window.location.href = '/login';
};
*/