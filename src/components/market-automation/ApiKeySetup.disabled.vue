<script setup lang="ts">
/**
 * API Key 设置组件
 *
 * 功能：
 * 1. 选择存储模式（本地/云端）
 * 2. 输入 API Key
 * 3. 本地模式：输入加密密码
 * 4. 保存 Key（本地加密或上传云端）
 */

import { ref, computed } from 'vue'
import { PlatformType } from '@/config/platform.config'
import { platformKeyManager } from '@/composables/platform-access'
import type { ApiKeyStorageMode } from '@/types/execution'

// Props
interface Props {
  platform: PlatformType
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [mode: ApiKeyStorageMode]
  'cancel': []
}>()

// 状态
const storageMode = ref<ApiKeyStorageMode>('local')
const apiKey = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

// 验证
const isApiKeyValid = computed(() => apiKey.value.length >= 10)
const isPasswordValid = computed(() => password.value.length >= 6)
const isPasswordMatch = computed(() => password.value === confirmPassword.value)

const canSubmit = computed(() => {
  if (!isApiKeyValid.value) return false

  if (storageMode.value === 'local') {
    return isPasswordValid.value && isPasswordMatch.value
  }

  return true
})

const passwordError = computed(() => {
  if (!password.value) return ''
  if (password.value.length < 6) return '密码至少需要6个字符'
  if (confirmPassword.value && !isPasswordMatch.value) return '两次输入的密码不一致'
  return ''
})

/**
 * 提交保存
 */
async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (storageMode.value === 'local') {
      // 本地模式：加密并存储到 localStorage
      await platformKeyManager.saveLocalKey(props.platform, apiKey.value, password.value)
    } else {
      // 云端模式：TODO - 调用云端存储 API
      // 暂时提示功能开发中
      errorMessage.value = '云端存储功能开发中'
      return
    }

    // 清除敏感数据
    apiKey.value = ''
    password.value = ''
    confirmPassword.value = ''

    emit('saved', storageMode.value)
    emit('update:modelValue', false)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '保存失败'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 取消
 */
function handleCancel() {
  apiKey.value = ''
  password.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  emit('cancel')
  emit('update:modelValue', false)
}

/**
 * 获取平台名称
 */
function getPlatformName(platform: PlatformType): string {
  const names: Record<PlatformType, string> = {
    [PlatformType.MARKET]: 'Market',
    [PlatformType.CSGOBUY]: 'CSGOBUY',
    [PlatformType.BUFF]: 'BUFF'
  }
  return names[platform] || platform
}
</script>

<template>
  <div class="api-key-setup">
    <div class="setup-header">
      <h3 class="setup-title">设置 {{ getPlatformName(platform) }} API Key</h3>
      <p class="setup-desc">
        API Key 将被安全加密存储，您可以选择本地存储或云端存储
      </p>
    </div>

    <div class="setup-form">
      <!-- 存储模式选择 -->
      <div class="form-group">
        <label class="form-label">存储模式</label>
        <div class="storage-mode-options">
          <label class="mode-option" :class="{ active: storageMode === 'local' }">
            <input v-model="storageMode" type="radio" value="local" class="mode-radio" />
            <div class="mode-content">
              <span class="mode-icon">🔒</span>
              <div class="mode-info">
                <span class="mode-name">本地存储</span>
                <span class="mode-desc">使用您的密码加密，仅存储在本设备</span>
              </div>
            </div>
          </label>

          <label class="mode-option" :class="{ active: storageMode === 'cloud' }">
            <input v-model="storageMode" type="radio" value="cloud" class="mode-radio" />
            <div class="mode-content">
              <span class="mode-icon">☁️</span>
              <div class="mode-info">
                <span class="mode-name">云端存储</span>
                <span class="mode-desc">加密存储在服务器，支持跨设备使用</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- API Key 输入 -->
      <div class="form-group">
        <label class="form-label" for="apiKey">API Key</label>
        <input id="apiKey" v-model="apiKey" type="password" class="form-input" placeholder="请输入您的 API Key"
          autocomplete="off" />
        <p v-if="apiKey && !isApiKeyValid" class="form-error">
          API Key 格式不正确
        </p>
      </div>

      <!-- 本地模式：密码输入 -->
      <template v-if="storageMode === 'local'">
        <div class="form-group">
          <label class="form-label" for="password">加密密码</label>
          <input id="password" v-model="password" type="password" class="form-input" placeholder="设置用于加密的密码（至少6位）"
            autocomplete="new-password" />
        </div>

        <div class="form-group">
          <label class="form-label" for="confirmPassword">确认密码</label>
          <input id="confirmPassword" v-model="confirmPassword" type="password" class="form-input" placeholder="再次输入密码"
            autocomplete="new-password" />
          <p v-if="passwordError" class="form-error">
            {{ passwordError }}
          </p>
        </div>

        <div class="form-tip">
          <span class="tip-icon">💡</span>
          <span class="tip-text">
            请牢记此密码，每次使用前需要输入密码解锁。密码丢失将无法恢复 API Key。
          </span>
        </div>
      </template>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="form-error-box">
        {{ errorMessage }}
      </div>

      <!-- 按钮 -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="handleCancel">
          取消
        </button>
        <button type="button" class="btn btn-primary" :disabled="!canSubmit || isSubmitting" @click="handleSubmit">
          <span v-if="isSubmitting" class="btn-loading"></span>
          {{ isSubmitting ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.api-key-setup {
  padding: 20px;
}

.setup-header {
  margin-bottom: 24px;
}

.setup-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary, #1f2937);
  margin: 0 0 8px;
}

.setup-desc {
  font-size: 14px;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-error {
  font-size: 12px;
  color: var(--error-color, #ef4444);
  margin: 0;
}

.form-error-box {
  padding: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--error-color, #ef4444);
  font-size: 14px;
}

.storage-mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-option {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.mode-option:hover {
  border-color: var(--primary-color, #3b82f6);
}

.mode-option.active {
  border-color: var(--primary-color, #3b82f6);
  background-color: rgba(59, 130, 246, 0.05);
}

.mode-radio {
  display: none;
}

.mode-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.mode-icon {
  font-size: 24px;
}

.mode-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
}

.mode-desc {
  font-size: 12px;
  color: var(--text-color-secondary, #6b7280);
}

.form-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background-color: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
}

.tip-icon {
  font-size: 16px;
}

.tip-text {
  font-size: 13px;
  color: var(--text-color-secondary, #6b7280);
  line-height: 1.5;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color-dark, #2563eb);
}

.btn-secondary {
  background-color: var(--bg-color-secondary, #f3f4f6);
  color: var(--text-color-primary, #1f2937);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-color-tertiary, #e5e7eb);
}

.btn-loading {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
