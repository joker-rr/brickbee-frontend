/**
 * 路由守卫统一导出和注册
 */

import type { Router } from 'vue-router'
import { createAuthGuard, type AuthGuardOptions } from './auth.guard'
import { createPermissionGuard, type PermissionGuardOptions } from './permission.guard'

// 导出所有守卫
export * from './auth.guard'
export * from './permission.guard'

/**
 * 守卫注册配置
 */
export interface GuardRegistrationOptions {
  /** 认证守卫配置 */
  auth?: AuthGuardOptions | false
  /** 权限守卫配置 */
  permission?: PermissionGuardOptions | false
  /** 是否设置页面标题 */
  setTitle?: boolean
  /** 应用标题（用于页面标题） */
  appTitle?: string
  /** 页面切换后是否滚动到顶部 */
  scrollToTop?: boolean
}

/**
 * 注册所有路由守卫
 */
export function setupRouterGuards(router: Router, options: GuardRegistrationOptions = {}): void {
  const {
    auth = {},
    permission = false,
    setTitle = true,
    appTitle = 'BrickBee',
    scrollToTop = true
  } = options

  // 全局前置守卫
  router.beforeEach((to, _from, next) => {
    // 设置页面标题
    if (setTitle && to.meta.title) {
      document.title = `${to.meta.title} - ${appTitle}`
    }

    next()
  })

  // 认证守卫
  if (auth !== false) {
    const authGuard = createAuthGuard(auth)
    router.beforeEach(authGuard)
  }

  // 权限守卫
  if (permission !== false) {
    const permissionGuard = createPermissionGuard(permission)
    router.beforeEach(permissionGuard)
  }

  // 全局后置守卫
  router.afterEach(() => {
    // 滚动到页面顶部
    if (scrollToTop) {
      window.scrollTo(0, 0)
    }
  })
}

/**
 * 简化版：仅注册认证守卫
 */
export function setupAuthGuard(router: Router, options?: AuthGuardOptions): void {
  const authGuard = createAuthGuard(options)
  router.beforeEach(authGuard)
}

/**
 * 简化版：仅注册权限守卫
 */
export function setupPermissionGuard(router: Router, options: PermissionGuardOptions): void {
  const permissionGuard = createPermissionGuard(options)
  router.beforeEach(permissionGuard)
}
