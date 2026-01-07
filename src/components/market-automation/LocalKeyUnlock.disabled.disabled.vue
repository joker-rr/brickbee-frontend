<script setup lang="ts">
/**
 * 本地 Key 解锁组件
 *
 * 功能：
 * 1. 输入解锁密码
 * 2. 解密本地存储的 API Key
 * 3. 创建执行会话
 * 4. 显示会话状态
 */

import { ref, computed, onMounted } from 'vue'
import { PlatformType } from '@/config/platform.config'
import { platformKeyManager, executionSessionManager } from '@/composables/platform-access'
import { useExecutionStore } from '@/stores/modules/execution'

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
  'unlocked': []
  'setup-required': []
}>()

// Stores
const executionStore = useExecutionStore()

// 状态
const password = ref('')
const isUnlocking = ref(false)
const errorMessage = ref('')
const hasLocalKey = ref(false)
const keyCreatedAt = ref<number | null>(null)

// 验证
const canUnlock = computed(() => password.value.length >= 6)

/**
 * 初始化检查
 */
onMounted(() => {
  checkLocalKey()
})

/**
 * 检查本地是否有存储的 Key
 */
function checkLocalKey() {
  hasLocalKey.value = platformKeyManager.hasLocalKey(props.platform)

  if (hasLocalKey.value) {
    const keyInfo = platformKeyManager.getLocalKeyInfo(props.platform)
    if (keyInfo) {
      keyCreatedAt.value = keyInfo.createdAt
    }
  } else {
    emit('setup-required')
  }
}

/**
 * 解锁并创建会话
 */
async function handleUnlock() {
  if (!canUnlock.value || isUnlocking.value) return

  isUnlocking.value = true
  errorMessage.value = ''

  try {
    // 1. 解密本地 Key
    const apiKey = await platformKeyManager.unlockLocalKey(props.platform, password.value)
    if (!apiKey) {
      errorMessage.value = '解锁失败，请检查密码是否正确'
      return
    }

    // 2. 创建执行会话
    await executionSessionManager.createSession(props.platform, apiKey)

    // 3. 获取会话并更新 Store
    const session = executionSessionManager.getSession(props.platform)
    if (session) {
      // 转换为 store 期望的格式
      executionStore.setSession({
        executionToken: session.executionToken,
        sessionId: `session_${session.platform}_${session.createdAt}`,
        expiresAt: session.expiresAt,
        refreshWindow: session.refreshWindow,
        status: session.status,
        platform: session.platform,
        storageMode: 'local',
        createdAt: session.createdAt,
        lastActivityAt: session.lastRefreshedAt,
        requestCount: session.requestCount
      })
    }

    // 清除密码
    password.value = ''

    emit('unlocked')
    emit('update:modelValue', false)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '解锁失败'
  } finally {
    isUnlocking.value = false
  }
}

/**
 * 取消
 */
function handleCancel() {
  password.value = ''
  errorMessage.value = ''
  emit('update:modelValue', false)
}

/**
 * 删除本地 Key
 */
function handleDeleteKey() {
  if (confirm('确定要删除本地存储的 API Key 吗？删除后需要重新设置。')) {
    platformKeyManager.removeLocalKey(props.platform)
    hasLocalKey.value = false
    emit('setup-required')
  }
}

/**
 * 格式化日期
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  <div class="local-key-unlock">
    <div class="unlock-header">
      <h3 class="unlock-title">解锁 {{ getPlatformName(platform) }} API Key</h3>
      <p class="unlock-desc">
        输入您的解锁密码以激活执行会话
      </p>
    </div>

    <template v-if="hasLocalKey">
      <div class="key-info">
        <div class="info-item">
          <span class="info-icon">🔐</span>
          <span class="info-text">
            API Key 已加密存储
            <span v-if="keyCreatedAt" class="info-date">
              ({{ formatDate(keyCreatedAt) }} 创建)
            </span>
          </span>
        </div>
      </div>

      <div class="unlock-form">
        <div class="form-group">
          <label class="form-label" for="unlockPassword">解锁密码</label>
          <input
            id="unlockPassword"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="请输入解锁密码"
            autocomplete="current-password"
            @keyup.enter="handleUnlock"
          />
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="form-error-box">
          {{ errorMessage }}
        </div>

        <!-- 按钮 -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-text btn-danger"
            @click="handleDeleteKey"
          >
            删除 Key
          </button>
          <div class="action-right">
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleCancel"
            >
              取消
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canUnlock || isUnlocking"
              @click="handleUnlock"
            >
              <span v-if="isUnlocking" class="btn-loading"></span>
              {{ isUnlocking ? '解锁中...' : '解锁' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="no-key-message">
        <span class="no-key-icon">🔑</span>
        <p class="no-key-text">未找到本地存储的 API Key</p>
        <p class="no-key-hint">请先设置 API Key</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.local-key-unlock {
  padding: 20px;
}

.unlock-header {
  margin-bottom: 20px;
}

.unlock-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary, #1f2937);
  margin: 0 0 8px;
}

.unlock-desc {
  font-size: 14px;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
}

.key-info {
  padding: 12px 16px;
  background-color: var(--bg-color-secondary, #f9fafb);
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 16px;
}

.info-text {
  font-size: 14px;
  color: var(--text-color-primary, #1f2937);
}

.info-date {
  color: var(--text-color-secondary, #6b7280);
  font-size: 12px;
}

.unlock-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.form-error-box {
  padding: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--error-color, #ef4444);
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.action-right {
  display: flex;
  gap: 12px;
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

.btn-text {
  background: none;
  padding: 10px 12px;
}

.btn-danger {
  color: var(--error-color, #ef4444);
}

.btn-danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.btn-loading {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.no-key-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.no-key-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-key-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
  margin: 0 0 8px;
}

.no-key-hint {
  font-size: 14px;
  color: var(--text-color-secondary, #6b7280);
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
