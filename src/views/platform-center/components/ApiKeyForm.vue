<script setup lang="ts">
/**
 * API Key 配置表单组件
 *
 * 用于配置平台的 API Key 和存储方式
 * 本地存储时支持用户自定义密钥加密
 */

import { ref, computed, watch } from 'vue'
import { PlatformType } from '@/config/platform.config'
import type { ApiKeyStorageType } from '@/types/platform'
import { getPasswordStrength } from '@/utils/crypto'

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------

const props = defineProps<{
  platform: PlatformType
  platformName: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'save', data: { apiKey: string; storageType: ApiKeyStorageType; encryptionKey?: string }): void
  (e: 'get-key'): void
}>()

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------

const apiKey = ref('')
const storageType = ref<ApiKeyStorageType>('server')
const showApiKey = ref(false)

// 本地加密相关
const encryptionKey = ref('')
const confirmEncryptionKey = ref('')
const showEncryptionKey = ref(false)

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

/**
 * 是否显示加密密钥输入（仅本地存储时）
 */
const showEncryptionSection = computed(() => {
  return storageType.value === 'local'
})

/**
 * 密钥强度
 */
const passwordStrength = computed(() => {
  if (!encryptionKey.value) return null
  return getPasswordStrength(encryptionKey.value)
})

/**
 * 密钥强度样式类
 */
const strengthClass = computed(() => {
  if (!passwordStrength.value) return ''
  return `strength-${passwordStrength.value}`
})

/**
 * 密钥强度文本
 */
const strengthText = computed(() => {
  switch (passwordStrength.value) {
    case 'weak':
      return '弱'
    case 'medium':
      return '中'
    case 'strong':
      return '强'
    default:
      return ''
  }
})

/**
 * 两次密钥是否匹配
 */
const keysMatch = computed(() => {
  if (!encryptionKey.value || !confirmEncryptionKey.value) return true
  return encryptionKey.value === confirmEncryptionKey.value
})

/**
 * 表单是否有效
 */
const isFormValid = computed(() => {
  // API Key 必填
  if (!apiKey.value.trim()) return false

  // 本地存储时需要加密密钥
  if (storageType.value === 'local') {
    if (!encryptionKey.value || encryptionKey.value.length < 6) return false
    if (encryptionKey.value !== confirmEncryptionKey.value) return false
  }

  return true
})

/**
 * 表单验证错误信息
 */
const validationErrors = computed(() => {
  const errors: string[] = []

  if (storageType.value === 'local') {
    if (encryptionKey.value && encryptionKey.value.length < 6) {
      errors.push('加密密钥至少需要 6 个字符')
    }
    if (!keysMatch.value) {
      errors.push('两次输入的密钥不一致')
    }
  }

  return errors
})

// --------------------------------------------------------------------------
// Watchers
// --------------------------------------------------------------------------

// 切换存储方式时清空加密密钥
watch(storageType, newValue => {
  if (newValue === 'server') {
    encryptionKey.value = ''
    confirmEncryptionKey.value = ''
  }
})

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

const handleSave = () => {
  if (!isFormValid.value) return

  emit('save', {
    apiKey: apiKey.value.trim(),
    storageType: storageType.value,
    encryptionKey: storageType.value === 'local' ? encryptionKey.value : undefined
  })
}

const handleGetKey = () => {
  emit('get-key')
}

const toggleApiKeyVisibility = () => {
  showApiKey.value = !showApiKey.value
}

const toggleEncryptionKeyVisibility = () => {
  showEncryptionKey.value = !showEncryptionKey.value
}
</script>

<template>
  <div class="api-key-form">
    <div class="form-header">
      <div class="header-icon">
        <span class="warning-icon">!</span>
      </div>
      <h3 class="header-title">尚未配置 API Key</h3>
      <p class="header-desc">请配置 {{ platformName }} 平台的 API Key 以使用相关功能</p>
    </div>

    <div class="form-content">
      <!-- API Key 输入 -->
      <div class="form-group">
        <label class="form-label">API Key</label>
        <div class="input-wrapper">
          <input
            v-model="apiKey"
            :type="showApiKey ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入 API Key"
          />
          <button type="button" class="toggle-visibility-btn" @click="toggleApiKeyVisibility">
            {{ showApiKey ? '隐藏' : '显示' }}
          </button>
        </div>
        <button type="button" class="get-key-link" @click="handleGetKey">
          前往获取 {{ platformName }} API Key
        </button>
      </div>

      <!-- 存储方式选择 -->
      <div class="form-group">
        <label class="form-label">存储方式（必选）</label>

        <div class="storage-options">
          <label class="storage-option" :class="{ active: storageType === 'server' }">
            <input
              v-model="storageType"
              type="radio"
              name="storageType"
              value="server"
              class="radio-input"
            />
            <div class="option-content">
              <div class="option-header">
                <span class="option-dot"></span>
                <span class="option-title">服务器存储（推荐）</span>
              </div>
              <p class="option-desc">多设备同步，支持后台任务</p>
            </div>
          </label>

          <label class="storage-option" :class="{ active: storageType === 'local' }">
            <input
              v-model="storageType"
              type="radio"
              name="storageType"
              value="local"
              class="radio-input"
            />
            <div class="option-content">
              <div class="option-header">
                <span class="option-dot"></span>
                <span class="option-title">本地存储（加密）</span>
              </div>
              <p class="option-desc">仅当前设备，使用您的密钥加密保护</p>
            </div>
          </label>
        </div>
      </div>

      <!-- 本地加密密钥输入（仅本地存储时显示） -->
      <Transition name="slide-fade">
        <div v-if="showEncryptionSection" class="form-group encryption-section">
          <label class="form-label">
            加密密钥
            <span class="label-hint">（用于加密保护您的 API Key）</span>
          </label>

          <div class="input-wrapper">
            <input
              v-model="encryptionKey"
              :type="showEncryptionKey ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入加密密钥（至少 6 位）"
            />
            <button
              type="button"
              class="toggle-visibility-btn"
              @click="toggleEncryptionKeyVisibility"
            >
              {{ showEncryptionKey ? '隐藏' : '显示' }}
            </button>
          </div>

          <!-- 密钥强度指示器 -->
          <div v-if="encryptionKey" class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :class="strengthClass"></div>
            </div>
            <span class="strength-text" :class="strengthClass">密钥强度：{{ strengthText }}</span>
          </div>

          <!-- 确认加密密钥 -->
          <div class="input-wrapper" style="margin-top: 12px">
            <input
              v-model="confirmEncryptionKey"
              :type="showEncryptionKey ? 'text' : 'password'"
              class="form-input"
              :class="{ error: !keysMatch }"
              placeholder="请再次输入加密密钥"
            />
          </div>

          <!-- 错误提示 -->
          <div v-if="!keysMatch" class="error-hint">两次输入的密钥不一致</div>

          <!-- 安全提示 -->
          <div class="security-notice">
            <span class="notice-icon">&#x1F512;</span>
            <span class="notice-text">
              请牢记此密钥！如果忘记，将无法解密 API Key，需要重新配置。
            </span>
          </div>
        </div>
      </Transition>

      <!-- 验证错误 -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div v-for="error in validationErrors" :key="error" class="error-item">
          {{ error }}
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button
        type="button"
        class="save-btn"
        :class="{ loading: loading }"
        :disabled="!isFormValid || loading"
        @click="handleSave"
      >
        <span v-if="loading" class="loading-spinner"></span>
        <span>{{ loading ? '验证中...' : '保存并验证' }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$primary-dark: #5a5fcf;
$primary-light: #eef0ff;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;
$warning-color: #f59e0b;
$warning-light: #fef3c7;
$error-color: #ef4444;
$success-color: #22c55e;

.api-key-form {
  max-width: 480px;
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;

  .header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: $warning-light;
    border-radius: 50%;
    margin-bottom: 16px;

    .warning-icon {
      font-size: 24px;
      font-weight: 700;
      color: $warning-color;
    }
  }

  .header-title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
  }

  .header-desc {
    margin: 0;
    font-size: 14px;
    color: $text-secondary;
  }
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  .form-label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;

    .label-hint {
      font-weight: 400;
      color: $text-secondary;
      font-size: 12px;
    }
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .form-input {
    flex: 1;
    height: 44px;
    padding: 0 80px 0 16px;
    border: 1px solid $border-color;
    border-radius: 8px;
    font-size: 14px;
    color: $text-primary;
    transition: all 0.2s ease;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    }

    &.error {
      border-color: $error-color;

      &:focus {
        box-shadow: 0 0 0 3px rgba($error-color, 0.1);
      }
    }
  }

  .toggle-visibility-btn {
    position: absolute;
    right: 12px;
    padding: 4px 8px;
    background: transparent;
    border: none;
    font-size: 12px;
    color: $text-secondary;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: $primary-color;
    }
  }
}

.get-key-link {
  margin-top: 8px;
  padding: 0;
  background: transparent;
  border: none;
  font-size: 13px;
  color: $primary-color;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: $primary-dark;
    text-decoration: underline;
  }
}

.storage-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.storage-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid $border-color;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $primary-color;
    background: $primary-light;
  }

  &.active {
    border-color: $primary-color;
    background: $primary-light;

    .option-dot {
      background: $primary-color;
      border-color: $primary-color;

      &::after {
        opacity: 1;
      }
    }
  }

  .radio-input {
    display: none;
  }
}

.option-content {
  flex: 1;

  .option-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .option-dot {
    position: relative;
    width: 16px;
    height: 16px;
    border: 2px solid $border-color;
    border-radius: 50%;
    background: #ffffff;
    transition: all 0.2s ease;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background: #ffffff;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
  }

  .option-title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  .option-desc {
    margin: 0;
    margin-left: 24px;
    font-size: 12px;
    color: $text-secondary;
  }
}

// 加密密钥区域
.encryption-section {
  padding: 20px;
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 8px;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;

  .strength-bar {
    flex: 1;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;

    .strength-fill {
      height: 100%;
      transition: width 0.3s ease, background 0.3s ease;

      &.strength-weak {
        width: 33%;
        background: $error-color;
      }

      &.strength-medium {
        width: 66%;
        background: $warning-color;
      }

      &.strength-strong {
        width: 100%;
        background: $success-color;
      }
    }
  }

  .strength-text {
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;

    &.strength-weak {
      color: $error-color;
    }

    &.strength-medium {
      color: $warning-color;
    }

    &.strength-strong {
      color: $success-color;
    }
  }
}

.error-hint {
  margin-top: 6px;
  font-size: 12px;
  color: $error-color;
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 6px;

  .notice-icon {
    font-size: 16px;
  }

  .notice-text {
    font-size: 12px;
    color: #92400e;
    line-height: 1.5;
  }
}

.validation-errors {
  padding: 12px;
  background: rgba($error-color, 0.1);
  border: 1px solid rgba($error-color, 0.2);
  border-radius: 6px;

  .error-item {
    font-size: 13px;
    color: $error-color;

    &:not(:last-child) {
      margin-bottom: 4px;
    }
  }
}

.form-footer {
  margin-top: 32px;
}

.save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  background: $primary-color;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: $primary-dark;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.loading {
    opacity: 0.8;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

// 动画
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
