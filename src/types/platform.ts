/**
 * 平台中心相关类型定义
 */

import type { PlatformType } from '@/config/platform.config'
import type { EncryptionResult } from '@/services/crypto.service'
/**
 * API Key 存储方式
 */
export type ApiKeyStorageType = 'server' | 'local'

/**
 * 平台状态
 */
export type PlatformStatus = 'unconfigured' | 'valid' | 'invalid'

/**
 * 平台配置信息
 */
export interface PlatformInfo {
  type: PlatformType
  name: string
  label: string
  icon: string
  color: string
}

/**
 * API Key 配置
 */
export interface ApiKeyConfig {
  id?: string
  platform: PlatformType
  apiKey?: string
  storageType: ApiKeyStorageType
  /** 本地存储时，API Key 是否已加密 */
  encrypted?: boolean
  createdAt?: string
  updatedAt?: string
  status?: PlatformStatus
  encryptedData?: EncryptionResult
}

/**
 * 平台状态信息
 */
export interface PlatformState {
  platform: PlatformType
  status: PlatformStatus
  storageType?: ApiKeyStorageType
  lastChecked?: string
  errorMessage?: string
}

/**
 * 保存 API Key 请求参数
 */
export interface SaveApiKeyParams {
  platform: PlatformType
  apiKey: string
  storageType: ApiKeyStorageType
  /** 本地存储时的加密密钥（仅用于本地加密，不会发送到服务器） */
  encryptionKey?: string
}

/**
 * 验证 API Key 响应
 */
export interface ValidateApiKeyResponse {
  valid: boolean
  message?: string
}

/**
 * 平台功能 Tab 类型
 */
export type PlatformTabType = 'inventory' | 'selling' | 'history' | 'automation'

// 从统一类型定义导出
export type { InventoryItem } from './inventory'
export type { SellingItem, SellHistoryItem } from './selling'

/**
 * 时间筛选范围
 */
export type TimeRange = 'today' | '7days' | '30days' | 'all'

/**
 * 销售历史筛选参数
 */
export interface SellHistoryFilter {
  timeRange: TimeRange
  startDate?: string
  endDate?: string
}
