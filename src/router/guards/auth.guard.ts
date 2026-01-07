/**
 * 认证路由守卫
 *
 * 处理需要登录的页面和只允许未登录访问的页面
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { tokenManager } from '@/utils/http/tokenManager'

/**
 * 认证守卫配置
 */
export interface AuthGuardOptions {
  /** 登录页路径 */
  loginPath?: string
  /** 默认跳转路径（已登录用户访问 guestOnly 页面时） */
  defaultPath?: string
  /** 是否在跳转登录页时保存原始路径 */
  saveRedirectPath?: boolean
}

const defaultOptions: AuthGuardOptions = {
  loginPath: '/login',
  defaultPath: '/',
  saveRedirectPath: true
}

/**
 * 创建认证守卫
 */
export function createAuthGuard(options: AuthGuardOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const hasToken = !!tokenManager.getToken()

    // 如果页面需要登录，但用户未登录
    if (to.meta.requiresAuth && !hasToken) {
      const query = config.saveRedirectPath ? { redirect: to.fullPath } : {}

      next({
        path: config.loginPath,
        query
      })
      return
    }

    // 如果页面只允许未登录访问（如登录页），但用户已登录
    if (to.meta.guestOnly && hasToken) {
      // 如果有重定向参数，跳转到原页面
      const redirect = (to.query.redirect as string) || config.defaultPath || '/'
      next(redirect)
      return
    }

    // 允许访问
    next()
  }
}

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  return !!tokenManager.getToken()
}

/**
 * 要求登录的守卫（用于特定路由）
 */
export function requireAuth(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  if (!isAuthenticated()) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  next()
}

/**
 * 仅游客访问的守卫（用于特定路由）
 */
export function guestOnly(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  if (isAuthenticated()) {
    next('/')
    return
  }
  next()
}

// 导出默认的认证守卫实例
export const authGuard = createAuthGuard()
