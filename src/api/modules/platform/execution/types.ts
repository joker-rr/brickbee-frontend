/*
 * @Author: joker.rrr 
 * @Date: 2025-12-28 01:10:03
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-28 01:10:50
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\modules\platform\execution\types.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 执行会话模块类型定义
 *
 * 包含执行会话、API Key 存储相关类型
 */

import type { PlatformType } from '@/config/platform.config'

/**
 * 执行会话状态
 */
export type ExecutionSessionStatus = 'idle' | 'created' | 'active' | 'expired' | 'error'

/**
 * 执行会话信息（前端持有）
 */
export interface ExecutionSession {
    /** 执行 Token */
    executionToken: string
    /** 会话 ID */
    sessionId: string
    /** 过期时间戳 */
    expiresAt: number
    /** 提前刷新时间（ms），默认 10分钟 */
    refreshWindow: number
    /** 会话状态 */
    status: ExecutionSessionStatus
    /** 平台类型 */
    platform: PlatformType
    /** 存储模式 */
    storageMode: ApiKeyStorageMode
    /** 创建时间 */
    createdAt: number
    /** 最后活跃时间 */
    lastActivityAt: number
    /** 请求计数 */
    requestCount: number
}

/**
 * 服务端执行会话（用于类型参考）
 */
export interface ServerExecutionSession {
    /** Token ID */
    tokenId: string
    /** 用户ID */
    userId: string
    /** 设备ID */
    deviceId: string
    /** 平台类型 */
    platform: PlatformType
    /** API Key (明文，仅在服务端内存中) */
    apiKey: string
    /** 存储模式 */
    storageMode: ApiKeyStorageMode
    /** 创建时间 */
    createdAt: Date
    /** 过期时间 */
    expiresAt: Date
    /** 最后活跃时间 */
    lastActivityAt: Date
    /** 请求计数 */
    requestCount: number
    /** 会话状态 */
    status: ExecutionSessionStatus
}

/**
 * API Key 存储模式
 */
export type ApiKeyStorageMode = 'local' | 'cloud'

/**
 * 本地加密存储的 Key
 */
export interface LocalEncryptedKey {
    /** 加密后的 Key */
    encryptedKey: string
    /** 初始化向量 (Base64) */
    iv: string
    /** 盐值 (Base64) */
    salt: string
    /** 认证标签 (Base64) */
    authTag: string
    /** 创建时间 */
    createdAt: number
    /** 平台类型 */
    platform: PlatformType
}

/**
 * 创建执行会话请求
 */
export interface CreateExecutionSessionRequest {
    /** 平台类型 */
    platform: PlatformType
    /** 存储模式 */
    storageMode: ApiKeyStorageMode
    /** 加密后的 Key（本地模式需要） */
    encryptedKey?: string
    /** 传输密钥（本地模式需要） */
    keyId?: string
    challengeId?: string
}

/**
 * 创建执行会话响应
 */
export interface CreateExecutionSessionResponse {
    /** 执行 Token */
    executionToken: string
    /** 会话 ID */
    sessionId: string
    /** 过期时间 (ISO 字符串) */
    expiresAt: string
}

/**
 * 刷新执行会话响应
 */
export interface RefreshExecutionSessionResponse {
    /** 新的执行 Token */
    executionToken: string
    /** 新的过期时间 (ISO 字符串) */
    expiresAt: string
}

/**
 * 执行会话状态响应
 */
export interface ExecutionSessionStatusResponse {
    /** 会话状态 */
    status: ExecutionSessionStatus
    /** 过期时间 (ISO 字符串) */
    expiresAt: string
    /** 请求计数 */
    requestCount: number
    /** 最后活跃时间 (ISO 字符串) */
    lastActivityAt: string
}

/**
 * 执行会话错误类型
 */
export type ExecutionSessionErrorCode =
    | 'EXECUTION_TOKEN_EXPIRED'
    | 'SESSION_NOT_FOUND'
    | 'KEY_DECRYPTION_FAILED'
    | 'INVALID_KEY_FORMAT'
    | 'MAX_SESSIONS_EXCEEDED'
    | 'SESSION_REFRESH_FAILED'

/**
 * 执行会话配置
 */
export interface ExecutionSessionConfig {
    /** 会话 TTL (ms) */
    sessionTTL: number
    /** 刷新窗口 (ms) */
    refreshWindow: number
    /** 每用户最大并发会话数 */
    maxSessionsPerUser: number
    /** 自动刷新间隔 (ms) */
    autoRefreshInterval: number
}

/**
 * 默认执行会话配置
 */
export const DEFAULT_EXECUTION_SESSION_CONFIG: ExecutionSessionConfig = {
    sessionTTL: 60 * 60 * 1000,           // 1小时
    refreshWindow: 10 * 60 * 1000,         // 10分钟
    maxSessionsPerUser: 3,
    autoRefreshInterval: 5 * 60 * 1000     // 5分钟检查一次
}






//   SecurityKeyChallengeId

/**
 * 执行会话信息（前端持有）
 */
export interface SecurityKeyChallengeId {
    /** 平台类型 */
    platform: PlatformType
}


/**
 * 创建公钥执行会话响应
 */
export interface GetSecurityKey {
    /** 会话 ID */
    keyId: string
    /** 公钥 */
    publicKey: string

}
/**
 * 创建ChallengeId会话响应
 */
export interface GetChallengeId {
    /** ChallengeId */
    challengeId: string
}
