/*
 * @Author: joker.rrr 
 * @Date: 2025-12-25 19:52:07
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-31 21:28:44
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\composables\platform\platform-access\platformKeyManager.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 平台 API Key 管理器
 *
 * 职责：
 * - 判断 API Key 来源（云端/本地）
 * - 不存储明文 Key
 * - 不直接调用第三方 API
 */

import { PlatformType } from '@/config/platform.config'
import { cryptoService } from '@/services/crypto.service'
import type { EncryptionResult } from '@/services/crypto.service'
import type {
  ApiKeyConfig,
  SaveApiKeyParams,
  ValidateApiKeyResponse,
  PlatformState
} from '@/types/platform'
import { platformApi } from '@/api/modules/platform'
import { executionSessionManager } from '@/composables/platform/platform-access'
// ============================================================================
// Types
// ============================================================================

export type ApiKeySource = 'cloud' | 'local' | 'none'

export interface LocalEncryptedKey {
  platform: PlatformType
  encryptedData: EncryptionResult
  createdAt: number
}

export interface PlatformKeyManager {
  /**
   * 获取指定平台的 Key 来源
   */
  // getKeySource(platform: PlatformType): ApiKeySource

  getAllApiKeys(): Promise<ApiKeyConfig[]>


  /**
   * 检查平台是否有可用的 Key（不论来源）
   */
  // hasAvailableKey(platform: PlatformType): boolean

  /**
   * 保存 Key的自动选择方式
   */
  saveApiKeyAuto(params: SaveApiKeyParams): Promise<ApiKeyConfig>

  /**
   * 删除本地加密 Key
   */
  deleteApiKeyAuto(config: ApiKeyConfig): void


  /**
   * 检查是否有本地加密 Key
   */
  // hasLocalKey(platform: PlatformType): boolean

  /**
   * 保存本地加密 Key
   */
  saveLocalKey(platform: PlatformType, apiKey: string, encryptionKey: string): Promise<ApiKeyConfig>


  /**
   * 解锁本地 Key（返回明文，仅用于创建 session）
   * @returns 明文 Key（调用方需在使用后立即清除引用）
   */
  unlockLocalKey(platform: PlatformType, password: string): Promise<string>

  /**
   * 移除本地 Key
   */
  removeLocalKey(platform: PlatformType): void

  /**
   * 获取本地 Key 元信息
   */
  // getLocalKeyInfo(platform: PlatformType): { createdAt: number } | null
}

// ============================================================================
// Constants
// ============================================================================

const LOCAL_STORAGE_KEY = 'BRICKBEE_API_KEYS'



// ============================================================================
// Implementation
// ============================================================================

class PlatformKeyManagerImpl implements PlatformKeyManager {



  /**
   * 获取 localStorage key
   */
  private getStorageKey(platform: PlatformType): string {
    return `${LOCAL_STORAGE_KEY}${platform}`
  }


  /**
   * 从本地存储获取 API Keys（原始数据，可能是加密的）
   */
  private getLocalApiKeysRaw(): Partial<Record<PlatformType, ApiKeyConfig>> {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }


  /**
   * 保存 API Key 到本地存储
   */
  saveLocalApiKeyRaw(config: ApiKeyConfig): void {
    const keys = this.getLocalApiKeysRaw()
    keys[config.platform] = config
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys))
  }

  // /**
  //  * 获取指定平台的 Key 来源
  //  */
  // getKeySource(platform: PlatformType): ApiKeySource {
  //   // 检查本地加密 Key
  //   if (this.hasLocalKey(platform)) {
  //     return 'local'
  //   }

  //   // TODO: 检查云端 Key（待后端实现）
  //   // if (this.hasCloudKey(platform)) {
  //   //   return 'cloud'
  //   // }

  //   return 'none'
  // }


  /**
   * 获取所有本地存储的 API Keys（原始配置，API Key 可能是加密的）
   */
  getLocalApiKeys(): ApiKeyConfig[] {
    const keys = this.getLocalApiKeysRaw()
    return Object.values(keys).filter(Boolean) as ApiKeyConfig[]
  }



  /**
   * 获取指定平台的本地 API Key 配置（原始，可能是加密的）
   */
  getLocalApiKey(platform: PlatformType): ApiKeyConfig | null {
    const keys = this.getLocalApiKeysRaw()
    return keys[platform] || null
  }




  /**
   * 检查平台是否有可用的 Key（不论来源）
   */
  // hasAvailableKey(platform: PlatformType): boolean {
  //   return this.getKeySource(platform) !== 'none'
  // }



  /**
   * 获取所有 API Keys（合并服务器和本地）
   * 注意：本地加密的 API Key 不会被解密，需要单独调用 decryptLocalApiKey
   */
  async getAllApiKeys(): Promise<ApiKeyConfig[]> {
    try {
      // 获取服务器端的 API Keys
      // const serverKeys = await platformApi.getApiKeys()
      // 获取本地存储的 API Keys
      const localKeys = this.getLocalApiKeys()
      // 合并，优先使用服务器端的配置
      const keyMap = new Map<PlatformType, ApiKeyConfig>()

      // 先添加本地的
      localKeys.forEach(key => {
        keyMap.set(key.platform, key)
      })

      // 服务器端的会覆盖本地的
      // serverKeys.forEach(key => {
      //   keyMap.set(key.platformType, key)
      // })
      return Array.from(keyMap.values())
    } catch {
      // 如果服务器请求失败，只返回本地的
      return this.getLocalApiKeys()
    }
  }




  saveApiKeyAuto(params: SaveApiKeyParams): Promise<ApiKeyConfig> {
    if (params.storageType === 'local') {
      return this.saveLocalKey(params.platform, params.apiKey, params.encryptionKey)
    }


    //  给保存到服务器预留方法
    // platformApi.deleteLocalApiKey(params.platform)
    // return await platformApi.saveApiKey(params)
  }

  /**
   * 删除 API Key（根据存储类型自动选择）
   */
  deleteApiKeyAuto(config: ApiKeyConfig): void {
    if (config.storageType === 'local') {
      this.removeLocalKey(config.platform)
    } else if (config.id) {
      //  给服务器删除预留方法
      // await this.deleteApiKey(config.id)
    }
  }

  // ============================================================================
  // 本地保存key用到的管理方法
  // ============================================================================


  // /**
  //  * 检查是否有本地加密 Key
  //  */
  // hasLocalKey(platform: PlatformType): boolean {
  //   const key = this.getStorageKey(platform)
  //   const stored = localStorage.getItem(key)
  //   return stored !== null
  // }

  /**
   * 保存本地加密 Key
   */
  async saveLocalKey(platform: PlatformType, apiKey: string, encryptionKey: string): Promise<ApiKeyConfig> {
    // 加密 Key
    const encryptedData = await cryptoService.encrypt(apiKey, encryptionKey)

    // 存储到 localStorage
    // const key = this.getStorageKey(platform)
    // localStorage.setItem(key, JSON.stringify(localKey))

    const config: ApiKeyConfig = {
      platform: platform,
      storageType: 'local',
      encrypted: true,
      encryptedData,
      createdAt: new Date().toISOString(),
      status: 'valid'
    }

    // 2. 创建执行会话
    await executionSessionManager.createSession(platform, apiKey)

    // 3. 获取会话并更新 Store
    const session = executionSessionManager.getSession(platform)


    this.saveLocalApiKeyRaw(config)

    return config
  }


  /**
   * 解锁本地 Key（返回明文，仅用于创建 session）
   */
  async unlockLocalKey(platform: PlatformType, password: string): Promise<string> {
    const stored = this.getLocalApiKey(platform)

    if (!stored) {
      throw new Error(`平台 ${platform} 没有本地加密 Key`)
    }
    // 解密
    const plaintext = await cryptoService.decrypt(stored.encryptedData, password)


    // 2. 创建执行会话
    await executionSessionManager.createSession(platform, plaintext)

    // 3. 获取会话并更新 Store
    const session = executionSessionManager.getSession(platform)


    return plaintext
  }

  /**
   * 移除本地 Key
   */
  async removeLocalKey(platform: PlatformType): Promise<void> {


    // 删除我们已经保存好的token
    await executionSessionManager.destroySession(platform)
    const keys = this.getLocalApiKeysRaw()
    delete keys[platform]
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys))
  }

  /**
   * 获取本地 Key 元信息
   */
  getLocalKeyInfo(platform: PlatformType): { createdAt: number } | null {
    const key = this.getStorageKey(platform)
    const stored = localStorage.getItem(key)

    if (!stored) {
      return null
    }

    const localKey: LocalEncryptedKey = JSON.parse(stored)
    return { createdAt: localKey.createdAt }
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const platformKeyManager: PlatformKeyManager = new PlatformKeyManagerImpl()