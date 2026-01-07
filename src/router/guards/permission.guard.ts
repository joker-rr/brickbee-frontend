/**
 * 权限路由守卫
 *
 * 处理基于角色和权限的访问控制
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'user' | 'guest'

/**
 * 权限类型
 */
export type Permission = string

/**
 * 扩展路由 meta 类型
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 允许访问的角色 */
    roles?: UserRole[]
    /** 需要的权限 */
    permissions?: Permission[]
  }
}

/**
 * 权限守卫配置
 */
export interface PermissionGuardOptions {
  /** 获取当前用户角色的函数 */
  getRoles: () => UserRole[]
  /** 获取当前用户权限的函数 */
  getPermissions: () => Permission[]
  /** 无权限时的跳转路径 */
  forbiddenPath?: string
  /** 无权限时的回调 */
  onForbidden?: (to: RouteLocationNormalized) => void
}

/**
 * 创建权限守卫
 */
export function createPermissionGuard(options: PermissionGuardOptions) {
  const { getRoles, getPermissions, forbiddenPath = '/403', onForbidden } = options

  return (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    // 检查角色权限
    if (to.meta.roles && to.meta.roles.length > 0) {
      const userRoles = getRoles()
      const hasRole = to.meta.roles.some((role) => userRoles.includes(role))

      if (!hasRole) {
        onForbidden?.(to)
        next(forbiddenPath)
        return
      }
    }

    // 检查具体权限
    if (to.meta.permissions && to.meta.permissions.length > 0) {
      const userPermissions = getPermissions()
      const hasPermission = to.meta.permissions.every((permission) =>
        userPermissions.includes(permission)
      )

      if (!hasPermission) {
        onForbidden?.(to)
        next(forbiddenPath)
        return
      }
    }

    // 允许访问
    next()
  }
}

/**
 * 检查用户是否具有指定角色
 */
export function hasRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true
  return requiredRoles.some((role) => userRoles.includes(role))
}

/**
 * 检查用户是否具有指定权限
 */
export function hasPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true
  return requiredPermissions.every((permission) => userPermissions.includes(permission))
}

/**
 * 检查用户是否具有任意一个指定权限
 */
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true
  return requiredPermissions.some((permission) => userPermissions.includes(permission))
}

/**
 * 创建角色检查守卫（用于特定路由）
 */
export function requireRoles(roles: UserRole[], getRoles: () => UserRole[]) {
  return (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const userRoles = getRoles()

    if (!hasRole(userRoles, roles)) {
      next('/403')
      return
    }

    next()
  }
}

/**
 * 创建权限检查守卫（用于特定路由）
 */
export function requirePermissions(permissions: Permission[], getPermissions: () => Permission[]) {
  return (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const userPermissions = getPermissions()

    if (!hasPermission(userPermissions, permissions)) {
      next('/403')
      return
    }

    next()
  }
}
