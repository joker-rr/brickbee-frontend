/**
 * 认证模块类型定义
 *
 * 包含 access_token, refresh_token 相关类型
 */

/**
 * Access Token JWT Payload
 */
export interface AccessTokenPayload {
  /** 用户ID */
  sub: string
  /** 签发时间 */
  iat: number
  /** 过期时间 */
  exp: number
  /** Token 类型 */
  type: 'access'
  /** 设备ID */
  deviceId: string
  /** 用户角色 */
  roles: string[]
  /** Token 版本（用于强制失效） */
  version: number
}

/**
 * Refresh Token 记录
 */
export interface RefreshTokenRecord {
  /** Token ID */
  id: string
  /** 用户ID */
  userId: string
  /** 设备ID */
  deviceId: string
  /** 过期时间 */
  expiresAt: Date
  /** 创建时间 */
  createdAt: Date
  /** 最后使用时间 */
  lastUsedAt: Date
  /** 是否被撤销 */
  revoked: boolean
  /** IP 地址 */
  ipAddress: string
  /** User Agent */
  userAgent: string
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 邮箱 */
  email: string
  /** 密码 */
  password: string
  /** 设备ID */
  deviceId: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** Access Token */
  accessToken: string
  /** 过期时间（秒） */
  expiresIn: number
}

/**
 * 刷新 Token 响应
 */
export interface RefreshTokenResponse {
  /** 新的 Access Token */
  accessToken: string
  /** 过期时间（秒） */
  expiresIn: number
}

/**
 * 认证错误类型
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCESS_TOKEN_EXPIRED'
  | 'REFRESH_TOKEN_EXPIRED'
  | 'TOKEN_REVOKED'
  | 'INVALID_TOKEN'
  | 'DEVICE_MISMATCH'
