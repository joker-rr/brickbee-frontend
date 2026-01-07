/**
 * 平台中心 Store
 *
 * 管理平台配置、API Key、以及平台数据
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PlatformType, platformConfig, getPlatformConfig } from '@/config/platform.config'
import { platformApi } from '@/api/modules/platform'
import type {
  ApiKeyConfig,
  PlatformState,
  PlatformStatus,
  ApiKeyStorageType,
  PlatformTabType,
  SellHistoryItem,
  SaveApiKeyParams
} from '@/types/platform'
import type { InventoryItem } from '@/types/inventory'
import type { SellingItem } from '@/types/selling'
import { logger } from '@/utils/logger'
import { toast } from '@/utils/toast'
import { platformKeyManager } from '@/composables/platform/platform-access'
/**
 * 解密状态接口
 */
interface DecryptionState {
  isEncrypted: boolean
  isUnlocked: boolean
  decryptedApiKey?: boolean
}

export const usePlatformStore = defineStore('platform', () => {


  // ============================================================================
  // State
  // ============================================================================

  /**
   * 当前选中的平台
   */
  const currentPlatform = ref<PlatformType>(platformConfig.defaultPlatform)

  /**
   * 当前激活的 Tab
   */
  const currentTab = ref<PlatformTabType>('inventory')

  /**
   * 各平台的 API Key 配置
   */
  const apiKeyConfigs = ref<Map<PlatformType, ApiKeyConfig>>(new Map())

  /**
   * 各平台的状态
   */
  const platformStates = ref<Map<PlatformType, PlatformState>>(new Map())

  /**
   * 加载状态
   */
  const loading = ref(false)

  /**
   * 是否已初始化
   */
  const initialized = ref(false)

  /**
   * 各平台的解密状态（会话内存储，不持久化）
   */
  const decryptionStates = ref<Map<PlatformType, DecryptionState>>(new Map())

  /**
   * 是否显示解密弹窗
   */
  const showDecryptModal = ref(false)

  /**
   * 解密弹窗的目标平台
   */
  const decryptTargetPlatform = ref<PlatformType | null>(null)

  /**
   * 解密验证中
   */
  const decryptLoading = ref(false)

  /**
   * 解密错误信息
   */
  const decryptError = ref('')

  // ============================================================================
  // 库存、在售、销售记录数据
  // ============================================================================

  /**
   * 各平台库存数据
   */
  const inventoryData = ref<Map<PlatformType, InventoryItem[]>>(new Map())

  /**
   * 各平台在售数据
   */
  const sellingData = ref<Map<PlatformType, SellingItem[]>>(new Map())

  /**
   * 各平台销售记录数据
   */
  const sellHistoryData = ref<Map<PlatformType, SellHistoryItem[]>>(new Map())

  // ============================================================================
  // Computed
  // ============================================================================

  /**
   * 当前平台配置
   */
  const currentPlatformConfig = computed(() => getPlatformConfig(currentPlatform.value))

  /**
   * 当前平台的 API Key 配置
   */
  const currentApiKeyConfig = computed(() => apiKeyConfigs.value.get(currentPlatform.value))

  /**
   * 当前平台状态
   */
  const currentPlatformState = computed((): PlatformState => {
    const state = platformStates.value.get(currentPlatform.value)
    if (state) return state

    // 根据 API Key 配置判断状态
    const config = currentApiKeyConfig.value
    return {
      platform: currentPlatform.value,
      status: config ? 'valid' : 'unconfigured'
    }
  })

  /**
   * 当前平台是否已配置
   */
  const isCurrentPlatformConfigured = computed(() => {
    return currentPlatformState.value.status !== 'unconfigured'
  })

  /**
   * 当前平台是否有效
   */
  const isCurrentPlatformValid = computed(() => {
    return currentPlatformState.value.status === 'valid'
  })

  /**
   * 所有平台列表（带状态）
   */
  const platformList = computed(() => {
    return platformConfig.platforms.map(platform => {
      const state = platformStates.value.get(platform.type)
      const config = apiKeyConfigs.value.get(platform.type)

      let status: PlatformStatus = 'unconfigured'
      if (config) {
        status = state?.status || 'valid'
      }

      return {
        ...platform,
        status,
        storageType: config?.storageType
      }
    })
  })

  /**
   * 当前平台是否已加密
   */
  const isCurrentPlatformEncrypted = computed(() => {
    const config = currentApiKeyConfig.value
    return config?.encrypted === true && config?.storageType === 'local'
  })

  /**
   * 当前平台是否已解锁（已输入正确密钥）
   */
  const isCurrentPlatformUnlocked = computed(() => {
    const state = decryptionStates.value.get(currentPlatform.value)
    return state?.isUnlocked === true
  })

  /**
   * 当前平台需要解密（已加密但未解锁）
   */
  const needsDecryption = computed(() => {
    return isCurrentPlatformEncrypted.value && !isCurrentPlatformUnlocked.value
  })

  /**
   * 当前平台的库存数据
   */
  const currentInventory = computed(() => inventoryData.value.get(currentPlatform.value) || [])

  /**
   * 当前平台的在售数据
   */
  const currentSelling = computed(() => sellingData.value.get(currentPlatform.value) || [])

  /**
   * 当前平台的销售记录
   */
  const currentSellHistory = computed(
    () => sellHistoryData.value.get(currentPlatform.value) || []
  )

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 初始化平台中心
   */
  const initialize = async (): Promise<void> => {
    if (initialized.value) return

    loading.value = true
    try {
      logger.log('初始化平台中心...')

      // 获取所有已配置的 API Keys
      const configs = await platformKeyManager.getAllApiKeys()
      configs.forEach(config => {
        apiKeyConfigs.value.set(config.platform, config)
        platformStates.value.set(config.platform, {
          platform: config.platform,
          status: config.status || 'valid',
          storageType: config.storageType
        })
      })

      initialized.value = true
      logger.log('平台中心初始化完成')
    } catch (error) {
      logger.error('平台中心初始化失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换平台
   */
  const switchPlatform = (platform: PlatformType): void => {
    currentPlatform.value = platform
    currentTab.value = 'inventory' // 切换平台时重置 Tab
    logger.log('切换平台:', platform)
  }

  /**
   * 切换 Tab
   */
  const switchTab = (tab: PlatformTabType): void => {
    currentTab.value = tab
  }

  /**
   * 保存 API Key
   */
  const saveApiKey = async (
    platform: PlatformType,
    apiKey: string,
    storageType: ApiKeyStorageType,
    encryptionKey?: string
  ): Promise<boolean> => {
    loading.value = true
    try {
      logger.log('保存 API Key:', platform, storageType, encryptionKey ? '(加密)' : '(未加密)')

      const params: SaveApiKeyParams = {
        platform,
        apiKey,
        storageType,
        encryptionKey
      }

      // 先验证 API Key
      // const validateResult = await platformApi.validateApiKey(platform, apiKey)
      // if (!validateResult.valid) {
      //   toast.error(validateResult.message || 'API Key 无效')
      //   return false
      // }

      // 保存 API Key


      const config = await platformKeyManager.saveApiKeyAuto(params)

      // 更新状态
      apiKeyConfigs.value.set(platform, config)
      platformStates.value.set(platform, {
        platform,
        status: 'valid',
        storageType
      })

      // 如果是加密存储，设置解密状态为已解锁（因为刚设置完密钥）
      if (encryptionKey) {


        decryptionStates.value.set(platform, {
          isEncrypted: true,
          isUnlocked: true,
          decryptedApiKey: true
        })
      }

      toast.success('API Key 保存成功')
      logger.log('API Key 保存成功:', platform)
      return true
    } catch (error) {
      logger.error('保存 API Key 失败:', error)
      toast.error('保存 API Key 失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除 API Key
   */
  const removeApiKey = async (platform: PlatformType): Promise<boolean> => {
    loading.value = true
    try {
      const config = apiKeyConfigs.value.get(platform)
      if (!config) {
        toast.warning('该平台未配置 API Key')
        return false
      }

      // await platformApi.deleteApiKeyAuto(config)
      platformKeyManager.deleteApiKeyAuto(config)

      // 删除服务器配置

      // 更新状态
      apiKeyConfigs.value.delete(platform)
      platformStates.value.set(platform, {
        platform,
        status: 'unconfigured'
      })

      // 清除该平台的数据
      inventoryData.value.delete(platform)
      sellingData.value.delete(platform)
      sellHistoryData.value.delete(platform)

      toast.success('平台配置已移除')
      logger.log('API Key 已删除:', platform)
      return true
    } catch (error) {
      logger.error('删除 API Key 失败:', error)
      toast.error('删除 API Key 失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 验证 API Key
   */
  const validateApiKey = async (
    platform: PlatformType,
    apiKey: string
  ): Promise<boolean> => {
    try {
      const result = await platformApi.validateApiKey(platform, apiKey)
      return result.valid
    } catch {
      return false
    }
  }

  /**
   * 刷新平台状态
   */
  const refreshPlatformStatus = async (platform: PlatformType): Promise<void> => {
    try {
      const status = await platformApi.getPlatformStatus(platform)
      platformStates.value.set(platform, status)
    } catch (error) {
      logger.error('刷新平台状态失败:', error)
    }
  }

  /**
   * 设置库存数据
   */
  const setInventory = (platform: PlatformType, items: InventoryItem[]): void => {
    inventoryData.value.set(platform, items)
  }

  /**
   * 设置在售数据
   */
  const setSelling = (platform: PlatformType, items: SellingItem[]): void => {
    sellingData.value.set(platform, items)
  }

  /**
   * 设置销售记录数据
   */
  const setSellHistory = (platform: PlatformType, items: SellHistoryItem[]): void => {
    sellHistoryData.value.set(platform, items)
  }

  /**
   * 清除平台数据
   */
  const clearPlatformData = (platform: PlatformType): void => {
    inventoryData.value.delete(platform)
    sellingData.value.delete(platform)
    sellHistoryData.value.delete(platform)
  }

  /**
   * 获取指定平台的 API Key
   */
  const getApiKey = (platform: PlatformType): string | null => {
    const config = apiKeyConfigs.value.get(platform)
    return config?.apiKey || null
  }

  /**
   * 检查平台是否已配置
   */
  const isPlatformConfigured = (platform: PlatformType): boolean => {
    return apiKeyConfigs.value.has(platform)
  }

  /**
   * 请求解密（显示解密弹窗）
   */
  const requestDecryption = (platform: PlatformType): void => {
    decryptTargetPlatform.value = platform
    decryptError.value = ''
    showDecryptModal.value = true
  }

  /**
   * 关闭解密弹窗
   */
  const closeDecryptModal = (): void => {
    showDecryptModal.value = false
    decryptTargetPlatform.value = null
    decryptError.value = ''
  }

  /**
   * 验证解密密钥并解锁平台
   */
  const unlockPlatform = async (encryptionKey: string): Promise<boolean> => {
    const platform = decryptTargetPlatform.value
    if (!platform) return false

    decryptLoading.value = true
    decryptError.value = ''

    try {
      logger.log('尝试解锁平台:', platform)

      // 获取解密后的 API Key
      const decryptedApiKey = await platformKeyManager.unlockLocalKey(platform, encryptionKey)

      if (decryptedApiKey) {
        // 设置解密状态
        decryptionStates.value.set(platform, {
          isEncrypted: true,
          isUnlocked: true,
          decryptedApiKey: true
        })

        closeDecryptModal()
        toast.success('平台已解锁')
        logger.log('平台解锁成功:', platform)
        return true
      } else {
        decryptError.value = '密钥错误，请重试'
        return false
      }
    } catch (error) {
      logger.error('解锁平台失败:', error)
      decryptError.value = '密钥错误或数据损坏'
      return false
    } finally {
      decryptLoading.value = false
    }
  }

  /**
   * 锁定平台（清除解密状态）
   */
  const lockPlatform = (platform: PlatformType): void => {
    const state = decryptionStates.value.get(platform)
    if (state) {
      decryptionStates.value.set(platform, {
        isEncrypted: true,
        isUnlocked: false,
        decryptedApiKey: undefined
      })
    }
    logger.log('平台已锁定:', platform)
  }



  // ============================================================================
  // 返回
  // ============================================================================

  return {
    // State
    currentPlatform,
    currentTab,
    apiKeyConfigs,
    platformStates,
    loading,
    initialized,
    inventoryData,
    sellingData,
    sellHistoryData,

    // 解密相关状态
    decryptionStates,
    showDecryptModal,
    decryptTargetPlatform,
    decryptLoading,
    decryptError,

    // Computed
    currentPlatformConfig,
    currentApiKeyConfig,
    currentPlatformState,
    isCurrentPlatformConfigured,
    isCurrentPlatformValid,
    platformList,
    currentInventory,
    currentSelling,
    currentSellHistory,
    isCurrentPlatformEncrypted,
    isCurrentPlatformUnlocked,
    needsDecryption,

    // Actions
    initialize,
    switchPlatform,
    switchTab,
    saveApiKey,
    removeApiKey,
    validateApiKey,
    refreshPlatformStatus,
    setInventory,
    setSelling,
    setSellHistory,
    clearPlatformData,
    getApiKey,
    isPlatformConfigured,

    // 解密相关 Actions
    requestDecryption,
    closeDecryptModal,
    unlockPlatform,
    lockPlatform,
  }
})
