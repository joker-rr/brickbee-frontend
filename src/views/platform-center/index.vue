<script setup lang="ts">
/**
 * 平台中心页面
 *
 * 统一管理各交易平台的 API Key 配置和数据
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlatformStore } from '@/stores/modules/platform'
import { useAuth } from '@/composables'
import { PlatformType } from '@/config/platform.config'
import type { ApiKeyStorageType, PlatformTabType } from '@/types/platform'

// 子组件
import PlatformList from './components/PlatformList.vue'
import PlatformHeader from './components/PlatformHeader.vue'
import PlatformTabs from './components/PlatformTabs.vue'
import ApiKeyForm from './components/ApiKeyForm.vue'
import InvalidApiKeyCard from './components/InvalidApiKeyCard.vue'
import InventoryTab from './components/InventoryTab.vue'
import SellingTab from './components/SellingTab.vue'
import SellHistoryTab from './components/SellHistoryTab.vue'
import AutomationTab from './components/AutomationTab.vue' // TODO: 暂时禁用，需要实现 execution 模块
import DecryptKeyModal from './components/DecryptKeyModal.vue'

// --------------------------------------------------------------------------
// Composables & Store
// --------------------------------------------------------------------------

const router = useRouter()
const platformStore = usePlatformStore()
const { isLoggedIn } = useAuth()

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------

const showReconfigureForm = ref(false)

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

const currentPlatformName = computed(() => {
  return platformStore.currentPlatformConfig?.name || ''
})

const platformStatus = computed(() => {
  return platformStore.currentPlatformState.status
})

const isConfigured = computed(() => {
  return platformStore.isCurrentPlatformConfigured
})

const isValid = computed(() => {
  return platformStore.isCurrentPlatformValid
})

const needsDecryption = computed(() => {
  return platformStore.needsDecryption
})

/**
 * 决定显示什么内容
 */
const contentMode = computed((): 'unconfigured' | 'invalid' | 'locked' | 'normal' => {
  if (showReconfigureForm.value) return 'unconfigured'
  if (!isConfigured.value) return 'unconfigured'
  if (!isValid.value) return 'invalid'
  if (needsDecryption.value) return 'locked'
  // 检查是否需要解密
  return 'normal'
})

// --------------------------------------------------------------------------
// Lifecycle
// --------------------------------------------------------------------------

onMounted(async () => {
  if (!isLoggedIn.value) {
    router.push('/login?redirect=/platform-center')
    return
  }

  await platformStore.initialize()
})

// 切换平台时重置状态
watch(
  () => platformStore.currentPlatform,
  () => {
    showReconfigureForm.value = false
  }
)

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

/**
 * 切换平台
 */
const handleSelectPlatform = (platform: PlatformType) => {
  platformStore.switchPlatform(platform)
}

/**
 * 切换 Tab
 */
const handleTabChange = (tab: PlatformTabType) => {
  platformStore.switchTab(tab)
}

/**
 * 保存 API Key
 */
const handleSaveApiKey = async (data: {
  apiKey: string
  storageType: ApiKeyStorageType
  encryptionKey?: string
}) => {
  const success = await platformStore.saveApiKey(
    platformStore.currentPlatform,
    data.apiKey,
    data.storageType,
    data.encryptionKey
  )

  if (success) {
    showReconfigureForm.value = false
  }
}

/**
 * 请求解锁加密平台
 */
const handleRequestUnlock = () => {
  platformStore.requestDecryption(platformStore.currentPlatform)
}

/**
 * 解密确认
 */
const handleDecryptConfirm = async (encryptionKey: string) => {
  await platformStore.unlockPlatform(encryptionKey)
}

/**
 * 解密取消
 */
const handleDecryptCancel = () => {
  platformStore.closeDecryptModal()
}

/**
 * 获取 API Key 帮助链接
 */
const handleGetApiKey = () => {
  // 根据不同平台跳转到对应的帮助页面
  const links: Record<PlatformType, string> = {
    [PlatformType.CSGOBUY]: 'https://www.csgobuy.com/api',
    [PlatformType.MARKET]: 'https://market.csgo.com/docs',
    [PlatformType.BUFF]: 'https://buff.163.com/api'
  }

  const url = links[platformStore.currentPlatform]
  if (url) {
    window.open(url, '_blank')
  }
}

/**
 * 重新配置
 */
const handleReconfigure = () => {
  showReconfigureForm.value = true
}

/**
 * 移除平台配置
 */
const handleRemovePlatform = async () => {
  if (!confirm(`确定要移除 ${currentPlatformName.value} 平台的配置吗？`)) {
    return
  }
  await platformStore.removeApiKey(platformStore.currentPlatform)
}

</script>

<template>
  <div class="platform-center">
    <div class="page-header">
      <h1 class="page-title">平台中心</h1>
    </div>

    <div class="page-content">
      <!-- 左侧：平台列表 -->
      <aside class="sidebar">
        <PlatformList :platforms="platformStore.platformList" :current-platform="platformStore.currentPlatform"
          @select="handleSelectPlatform" />
      </aside>

      <!-- 右侧：平台详情 -->
      <main class="main-area">


        <!-- 未配置状态 -->
        <template v-if="contentMode === 'unconfigured'">
          <div class="config-section">
            <h2 class="section-title">{{ currentPlatformName }} 平台配置</h2>
            <ApiKeyForm :platform="platformStore.currentPlatform" :platform-name="currentPlatformName"
              :loading="platformStore.loading" @save="handleSaveApiKey" @get-key="handleGetApiKey" />
          </div>
        </template>

        <!-- 加密锁定状态 -->
        <template v-else-if="contentMode === 'locked'">
          <div class="locked-section">
            <div class="locked-card">
              <div class="locked-icon">
                <span>&#x1F512;</span>
              </div>
              <h3 class="locked-title">平台已加密</h3>
              <p class="locked-desc">
                您的 {{ currentPlatformName }} API Key 已加密存储，请输入密钥解锁,如果忘记密钥请 <button type="button" class="delete-btn"
                  @click="handleRemovePlatform">
                  删除密钥
                </button>
              </p>


              <button type="button" class="unlock-btn" @click="handleRequestUnlock">
                输入密钥解锁
              </button>


            </div>
          </div>
        </template>

        <!-- API Key 失效状态 -->
        <template v-else-if="contentMode === 'invalid'">
          <InvalidApiKeyCard @reconfigure="handleReconfigure" />
        </template>

        <!-- 正常状态 -->
        <template v-else>
          <!-- 平台信息头部 -->
          <PlatformHeader :platform-name="currentPlatformName" :status="platformStatus"
            :storage-type="platformStore.currentApiKeyConfig?.storageType" :loading="platformStore.loading"
            @reconfigure="handleReconfigure" @remove="handleRemovePlatform" />

          <!-- 功能 Tab -->
          <div class="tabs-section">
            <PlatformTabs :current-tab="platformStore.currentTab" @change="handleTabChange" />
          </div>

          <!-- Tab 内容 -->
          <div class="tab-content">
            <!-- 库存 -->
            <InventoryTab v-if="platformStore.currentTab === 'inventory'" :platform="platformStore.currentPlatform" />

            <!-- 在售 -->
            <SellingTab v-if="platformStore.currentTab === 'selling'" :platform="platformStore.currentPlatform" />

            <!-- 销售记录 -->
            <SellHistoryTab v-if="platformStore.currentTab === 'history'" :items="platformStore.currentSellHistory"
              :loading="false" />

            <!-- 自动化 -->
            <AutomationTab v-if="platformStore.currentTab === 'automation'" :platform="platformStore.currentPlatform" />
          </div>
        </template>
      </main>
    </div>

    <!-- 解密密钥弹窗 -->
    <DecryptKeyModal :visible="platformStore.showDecryptModal" :platform-name="currentPlatformName"
      :loading="platformStore.decryptLoading" :error="platformStore.decryptError"
      @update:visible="(val: boolean) => !val && handleDecryptCancel()" @confirm="handleDecryptConfirm"
      @cancel="handleDecryptCancel" />
  </div>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;
$background-color: #f7f8fc;

.platform-center {
  min-height: 100vh;
  padding: 20px 24px;
  background: $background-color;
}

.page-header {
  margin-bottom: 24px;

  .page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: $text-primary;
  }
}

.page-content {
  display: flex;
  gap: 24px;
  min-height: calc(100vh - 120px);
}

.sidebar {
  flex-shrink: 0;
  width: 260px;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-section {
  .section-title {
    margin: 0 0 20px;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
  }
}

.tabs-section {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid $border-color;
}

.tab-content {
  flex: 1;
}

// 锁定状态样式
.locked-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.locked-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px;
  background: #ffffff;
  border: 1px solid $border-color;
  border-radius: 16px;
  max-width: 400px;

  .locked-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 50%;
    margin-bottom: 24px;
    font-size: 36px;
  }

  .locked-title {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
    color: $text-primary;
  }

  .locked-desc {
    margin: 0 0 28px;
    font-size: 15px;
    color: $text-secondary;
    line-height: 1.6;
  }

  .keyManaget-btn {
    display: flex;
  }

  .delete-btn {
    color: var(--error-color, #ef4444);
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s, background-color 0.2s;
    display: inline;
    align-items: center;
    gap: 8px;

    &:hover {
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .unlock-btn {
    padding: 14px 36px;
    background: $primary-color;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #5a5fcf;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($primary-color, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// 响应式
@media (max-width: 1024px) {
  .page-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .platform-center {
    padding: 16px;
  }

  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: 24px;
    }
  }

  .page-content {
    gap: 16px;
    min-height: auto;
  }
}
</style>
