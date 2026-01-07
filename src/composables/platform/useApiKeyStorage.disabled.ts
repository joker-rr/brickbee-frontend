/**
 * API Key 本地加密存储 Composable
 *
 * @deprecated 业务模块应直接使用 platformKeyManager
 * 此 composable 仅作为 Vue 组件的便捷封装
 *
 * 迁移指南：
 * - 检查 Key: platformKeyManager.hasLocalKey(platform)
 * - 保存 Key: platformKeyManager.saveLocalKey(platform, apiKey, password)
 * - 解锁 Key: platformKeyManager.unlockLocalKey(platform, password)
 * - 删除 Key: platformKeyManager.removeLocalKey(platform)
 */

import { ref, computed } from 'vue'
import { PlatformType } from '@/config/platform.config'
import { platformKeyManager } from '@/composables/platform-access'
import { cryptoService } from '@/services/crypto.service'
import { logger } from '@/utils/logger'

/**
 * API Key 本地加密存储 Composable
 *
 * @deprecated 业务模块应直接使用 platformKeyManager
 */
export function useApiKeyStorage() {
  /** 是否正在处理 */
  const isProcessing = ref(false)

  /** 错误信息 */
  const error = ref<string | null>(null)

  /**
   * 检查是否有本地存储的 Key
   *
   * @deprecated 请使用 platformKeyManager.hasLocalKey()
   */
  function hasLocalKey(platform: PlatformType): boolean {
    return platformKeyManager.hasLocalKey(platform)
  }

  /**
   * 获取所有已存储的平台
   *
   * @deprecated 请使用 platformKeyManager.hasLocalKey() 逐个检查
   */
  function getStoredPlatforms(): PlatformType[] {
    const platforms: PlatformType[] = []

    for (const platform of Object.values(PlatformType)) {
      if (platformKeyManager.hasLocalKey(platform)) {
        platforms.push(platform)
      }
    }

    return platforms
  }

  /**
   * 获取本地存储的加密 Key 信息（不包含明文）
   *
   * @deprecated 请使用 platformKeyManager.getLocalKeyInfo()
   */
  function getLocalKeyInfo(platform: PlatformType): { createdAt: number } | null {
    return platformKeyManager.getLocalKeyInfo(platform)
  }

  /**
   * 加密并保存 API Key 到 localStorage
   *
   * @deprecated 请使用 platformKeyManager.saveLocalKey()
   */
  async function saveLocal(
    platform: PlatformType,
    apiKey: string,
    password: string
  ): Promise<boolean> {
    if (!apiKey || !password) {
      error.value = 'API Key 和密码不能为空'
      return false
    }

    isProcessing.value = true
    error.value = null

    try {
      await platformKeyManager.saveLocalKey(platform, apiKey, password)
      logger.log(`[useApiKeyStorage] API Key 已加密存储: ${platform}`)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '加密失败'
      error.value = message
      logger.error('[useApiKeyStorage] 加密存储失败:', err)
      return false
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 解密本地存储的 API Key
   *
   * @deprecated 请使用 platformKeyManager.unlockLocalKey()
   */
  async function decryptLocal(
    platform: PlatformType,
    password: string
  ): Promise<string | null> {
    if (!password) {
      error.value = '密码不能为空'
      return null
    }

    if (!platformKeyManager.hasLocalKey(platform)) {
      error.value = '未找到本地存储的 API Key'
      return null
    }

    isProcessing.value = true
    error.value = null

    try {
      const decrypted = await platformKeyManager.unlockLocalKey(platform, password)
      logger.log(`[useApiKeyStorage] API Key 解密成功: ${platform}`)
      return decrypted
    } catch (err) {
      error.value = '密码错误或数据损坏'
      logger.error('[useApiKeyStorage] 解密失败:', err)
      return null
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 删除本地存储的 Key
   *
   * @deprecated 请使用 platformKeyManager.removeLocalKey()
   */
  function removeLocal(platform: PlatformType): void {
    platformKeyManager.removeLocalKey(platform)
    logger.log(`[useApiKeyStorage] 本地存储的 Key 已删除: ${platform}`)
  }

  /**
   * 清除所有本地存储的 Key
   *
   * @deprecated 请逐个调用 platformKeyManager.removeLocalKey()
   */
  function clearAll(): void {
    for (const platform of Object.values(PlatformType)) {
      platformKeyManager.removeLocalKey(platform)
    }
    logger.log('[useApiKeyStorage] 所有本地存储的 Key 已清除')
  }

  /**
   * 验证密码是否正确（通过尝试解密）
   *
   * @deprecated 请使用 platformKeyManager.unlockLocalKey() 并处理异常
   */
  async function verifyPassword(
    platform: PlatformType,
    password: string
  ): Promise<boolean> {
    try {
      await platformKeyManager.unlockLocalKey(platform, password)
      return true
    } catch {
      return false
    }
  }

  /**
   * 生成用于传输的加密数据
   * 用于创建执行会话时安全传输 API Key
   *
   * @deprecated 此功能已由 executionSessionManager 内部处理
   */
  async function encryptForTransport(
    apiKey: string
  ): Promise<{ encryptedKey: string; transportKey: string; iv: string } | null> {
    isProcessing.value = true
    error.value = null

    try {
      // 生成临时传输密钥
      const { key, exportedKey } = await cryptoService.generateTransportKey()

      // 使用传输密钥加密 API Key
      const encrypted = await cryptoService.encryptWithTransportKey(apiKey, key)

      return {
        encryptedKey: encrypted.ciphertext,
        transportKey: exportedKey,
        iv: encrypted.iv
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '传输加密失败'
      error.value = message
      logger.error('[useApiKeyStorage] 传输加密失败:', err)
      return null
    } finally {
      isProcessing.value = false
    }
  }

  return {
    // 状态
    isProcessing: computed(() => isProcessing.value),
    error: computed(() => error.value),

    // 方法（委托给 platformKeyManager）
    hasLocalKey,
    getStoredPlatforms,
    getLocalKeyInfo,
    saveLocal,
    decryptLocal,
    removeLocal,
    clearAll,
    verifyPassword,
    encryptForTransport
  }
}