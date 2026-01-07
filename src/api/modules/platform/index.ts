/**
 * 平台 API Key 管理接口
 *
 * 支持服务器存储和本地加密存储
 */

import { request } from '@/api/client'
import { API_PREFIX } from '@/api/common'
import type { PlatformType } from '@/config/platform.config'
import type {
  ApiKeyConfig,
  SaveApiKeyParams,
  ValidateApiKeyResponse,
  PlatformState
} from '@/types/platform'
import { encrypt, decrypt, verifyPassword } from '@/utils/crypto'

/**
 * API Key 存储键名
 */
// const LOCAL_STORAGE_KEY = 'brickbee_api_keys'

// /**
//  * 从本地存储获取 API Keys（原始数据，可能是加密的）
//  */
// function getLocalApiKeysRaw(): Partial<Record<PlatformType, ApiKeyConfig>> {
//   try {
//     const data = localStorage.getItem(LOCAL_STORAGE_KEY)
//     return data ? JSON.parse(data) : {}
//   } catch {
//     return {}
//   }
// }

// /**
//  * 保存 API Key 到本地存储
//  */
// function saveLocalApiKeyRaw(config: ApiKeyConfig): void {
//   const keys = getLocalApiKeysRaw()
//   keys[config.platformType] = config
//   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys))
// }

// /**
//  * 从本地存储删除 API Key
//  */
// function removeLocalApiKey(platformType: PlatformType): void {
//   const keys = getLocalApiKeysRaw()
//   delete keys[platformType]
//   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys))
// }

/**
 * 平台 API Key 管理接口
 */
export const platformApi = {
  /**
   * 获取所有已配置的平台 API Keys（服务器端）
   */
  getApiKeys: () =>
    request.get<ApiKeyConfig[]>(`${API_PREFIX.PLATFORM_API}/`, {
      showLoading: false
    }),

  /**
   * 保存 API Key 到服务器
   */
  saveApiKey: (params: SaveApiKeyParams) =>
    request.post<ApiKeyConfig>(`${API_PREFIX.PLATFORM_API}/`, params, {
      showLoading: true
    }),

  /**
   * 更新 API Key
   */
  updateApiKey: (id: string, params: Partial<SaveApiKeyParams>) =>
    request.put<ApiKeyConfig>(`${API_PREFIX.PLATFORM_API}/${id}`, params, {
      showLoading: true
    }),

  /**
   * 删除 API Key（服务器端）
   */
  deleteApiKey: (id: string) =>
    request.delete(`${API_PREFIX.PLATFORM_API}/${id}`, {
      showLoading: true
    }),

  /**
   * 验证 API Key 是否有效
   */
  validateApiKey: (platform: PlatformType, apiKey: string) =>
    request.post<ValidateApiKeyResponse>(
      `${API_PREFIX.PLATFORM_API}/validate`,
      { platform, apiKey },
      { showLoading: true }
    ),

  /**
   * 获取平台状态
   */
  getPlatformStatus: (platform: PlatformType) =>
    request.get<PlatformState>(`${API_PREFIX.PLATFORM_API}/status/${platform}`, {
      showLoading: false
    }),

  // ============================================================================
  // 本地存储相关方法（支持加密）
  // ============================================================================

  //   /**
  //    * 获取所有本地存储的 API Keys（原始配置，API Key 可能是加密的）
  //    */
  //   getLocalApiKeys: (): ApiKeyConfig[] => {
  //     const keys = getLocalApiKeysRaw()
  //     return Object.values(keys).filter(Boolean) as ApiKeyConfig[]
  //   },

  //   /**
  //    * 获取指定平台的本地 API Key 配置（原始，可能是加密的）
  //    */
  //   getLocalApiKey: (platformType: PlatformType): ApiKeyConfig | null => {
  //     const keys = getLocalApiKeysRaw()
  //     return keys[platformType] || null
  //   },

  //   /**
  //    * 检查本地 API Key 是否已加密
  //    */
  //   isLocalApiKeyEncrypted: (platformType: PlatformType): boolean => {
  //     const config = platformApi.getLocalApiKey(platformType)
  //     return config?.encrypted === true
  //   },

  //   /**
  //    * 验证加密密钥是否正确
  //    */
  //   verifyEncryptionKey: async (
  //     platformType: PlatformType,
  //     encryptionKey: string
  //   ): Promise<boolean> => {
  //     const config = platformApi.getLocalApiKey(platformType)
  //     if (!config || !config.encrypted) return true

  //     return verifyPassword(config.apiKey, encryptionKey)
  //   },

  //   /**
  //    * 解密本地 API Key
  //    *
  //    * @param platformType - 平台类型
  //    * @param encryptionKey - 用户密钥
  //    * @returns 解密后的 API Key，如果解密失败返回 null
  //    */
  //   decryptLocalApiKey: async (
  //     platformType: PlatformType,
  //     encryptionKey: string
  //   ): Promise<string | null> => {
  //     const config = platformApi.getLocalApiKey(platformType)
  //     if (!config) return null

  //     // 如果没有加密，直接返回
  //     if (!config.encrypted) {
  //       return config.apiKey
  //     }

  //     try {
  //       return await decrypt(config.apiKey, encryptionKey)
  //     } catch {
  //       return null
  //     }
  //   },

  //   /**
  //    * 保存 API Key 到本地存储（支持加密）
  //    *
  //    * @param params - 保存参数
  //    * @param params.encryptionKey - 加密密钥（如果提供，则加密存储）
  //    */
  //   saveLocalApiKey: async (params: SaveApiKeyParams): Promise<ApiKeyConfig> => {
  //     let apiKeyToStore = params.apiKey
  //     let encrypted = false

  //     // 如果提供了加密密钥，则加密 API Key
  //     if (params.encryptionKey) {
  //       apiKeyToStore = await encrypt(params.apiKey, params.encryptionKey)
  //       encrypted = true
  //     }

  //     const config: ApiKeyConfig = {
  //       platformType: params.platformType,
  //       apiKey: apiKeyToStore,
  //       storageType: 'local',
  //       encrypted,
  //       id: `local_${params.platformType}_${Date.now()}`,
  //       createdAt: new Date().toISOString(),
  //       updatedAt: new Date().toISOString(),
  //       status: 'valid'
  //     }

  //     saveLocalApiKeyRaw(config)
  //     return config
  //   },

  //   /**
  //    * 删除本地存储的 API Key
  //    */
  //   deleteLocalApiKey: (platformType: PlatformType): void => {
  //     removeLocalApiKey(platformType)
  //   },

  //   // ============================================================================
  //   // 统一管理方法（根据存储类型自动选择）
  //   // ============================================================================

  //   /**
  //    * 保存 API Key（根据存储类型自动选择）
  //    */
  //   saveApiKeyAuto: async (params: SaveApiKeyParams): Promise<ApiKeyConfig> => {
  //     if (params.storageType === 'local') {
  //       return platformApi.saveLocalApiKey(params)
  //     }

  //     platformApi.deleteLocalApiKey(params.platformType)
  //     return await platformApi.saveApiKey(params)
  //   },

  //   /**
  //    * 删除 API Key（根据存储类型自动选择）
  //    */
  //   deleteApiKeyAuto: async (config: ApiKeyConfig): Promise<void> => {
  //     if (config.storageType === 'local') {
  //       platformApi.deleteLocalApiKey(config.platformType)
  //     } else if (config.id) {
  //       await platformApi.deleteApiKey(config.id)
  //     }
  //   },

  //   /**
  //    * 获取所有 API Keys（合并服务器和本地）
  //    * 注意：本地加密的 API Key 不会被解密，需要单独调用 decryptLocalApiKey
  //    */
  //   getAllApiKeys: async (): Promise<ApiKeyConfig[]> => {
  //     try {
  //       // 获取服务器端的 API Keys
  //       const serverKeys = await platformApi.getApiKeys()
  //       // 获取本地存储的 API Keys
  //       const localKeys = platformApi.getLocalApiKeys()
  //       // 合并，优先使用服务器端的配置
  //       const keyMap = new Map<PlatformType, ApiKeyConfig>()

  //       // 先添加本地的
  //       localKeys.forEach(key => {
  //         keyMap.set(key.platformType, key)
  //       })

  //       // 服务器端的会覆盖本地的
  //       serverKeys.forEach(key => {
  //         keyMap.set(key.platformType, key)
  //       })

  //       return Array.from(keyMap.values())
  //     } catch {
  //       // 如果服务器请求失败，只返回本地的
  //       return platformApi.getLocalApiKeys()
  //     }
  //   },

  //   /**
  //    * 获取指定平台的 API Key 配置
  //    */
  //   getApiKeyByPlatform: async (platformType: PlatformType): Promise<ApiKeyConfig | null> => {
  //     try {
  //       const allKeys = await platformApi.getAllApiKeys()
  //       return allKeys.find(key => key.platformType === platformType) || null
  //     } catch {
  //       return platformApi.getLocalApiKey(platformType)
  //     }
  //   },

  //   /**
  //    * 检查平台是否已配置 API Key
  //    */
  //   isPlatformConfigured: async (platformType: PlatformType): Promise<boolean> => {
  //     const config = await platformApi.getApiKeyByPlatform(platformType)
  //     return config !== null
  //   },

  //   /**
  //    * 获取解密后的 API Key（用于实际使用）
  //    *
  //    * @param platformType - 平台类型
  //    * @param encryptionKey - 加密密钥（如果是加密存储的）
  //    * @returns 解密后的 API Key
  //    */
  //   getDecryptedApiKey: async (
  //     platformType: PlatformType,
  //     encryptionKey?: string
  //   ): Promise<string | null> => {
  //     const config = await platformApi.getApiKeyByPlatform(platformType)
  //     if (!config) return null

  //     // 服务器存储的直接返回
  //     if (config.storageType === 'server') {
  //       return config.apiKey
  //     }

  //     // 本地未加密的直接返回
  //     if (!config.encrypted) {
  //       return config.apiKey
  //     }

  //     // 本地加密的需要解密
  //     if (!encryptionKey) {
  //       throw new Error('需要提供加密密钥来解密 API Key')
  //     }

  //     return platformApi.decryptLocalApiKey(platformType, encryptionKey)
  //   }
}

export default platformApi
