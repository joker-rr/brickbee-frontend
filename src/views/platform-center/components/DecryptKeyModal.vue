<script setup lang="ts">
/**
 * 解密密钥输入弹窗
 *
 * 当用户需要使用本地加密存储的 API Key 时，弹出此窗口输入密钥
 */

import { ref, computed } from 'vue'

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------

const props = defineProps<{
  visible: boolean
  platformName: string
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', encryptionKey: string): void
  (e: 'cancel'): void
}>()

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------

const encryptionKey = ref('')
const showKey = ref(false)

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

const isValid = computed(() => {
  return encryptionKey.value.length >= 6
})

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

const handleConfirm = () => {
  if (!isValid.value) return
  emit('confirm', encryptionKey.value)
}

const handleCancel = () => {
  encryptionKey.value = ''
  emit('cancel')
  emit('update:visible', false)
}

const handleClose = () => {
  encryptionKey.value = ''
  emit('update:visible', false)
}

const toggleKeyVisibility = () => {
  showKey.value = !showKey.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <div class="modal-header">
            <div class="header-icon">
              <span>&#x1F512;</span>
            </div>
            <h3 class="modal-title">输入解密密钥</h3>
            <p class="modal-desc">请输入您设置的加密密钥以解锁 {{ platformName }} 平台</p>
          </div>

          <div class="modal-body">
            <div class="input-group">
              <label class="input-label">加密密钥</label>
              <div class="input-wrapper">
                <input
                  v-model="encryptionKey"
                  :type="showKey ? 'text' : 'password'"
                  class="key-input"
                  placeholder="请输入您设置的加密密钥"
                  @keyup.enter="handleConfirm"
                />
                <button type="button" class="toggle-btn" @click="toggleKeyVisibility">
                  {{ showKey ? '隐藏' : '显示' }}
                </button>
              </div>

              <!-- 错误提示 -->
              <div v-if="error" class="error-message">
                <span class="error-icon">!</span>
                <span>{{ error }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="handleCancel">取消</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!isValid || loading"
              @click="handleConfirm"
            >
              <span v-if="loading" class="loading-spinner"></span>
              <span>{{ loading ? '验证中...' : '确认' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$primary-dark: #5a5fcf;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;
$error-color: #ef4444;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 32px 24px 24px;
  text-align: center;

  .header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 50%;
    margin-bottom: 16px;
    font-size: 28px;
  }

  .modal-title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
  }

  .modal-desc {
    margin: 0;
    font-size: 14px;
    color: $text-secondary;
    line-height: 1.5;
  }
}

.modal-body {
  padding: 0 24px 24px;
}

.input-group {
  .input-label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .key-input {
    flex: 1;
    height: 48px;
    padding: 0 80px 0 16px;
    border: 1px solid $border-color;
    border-radius: 8px;
    font-size: 15px;
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
  }

  .toggle-btn {
    position: absolute;
    right: 12px;
    padding: 4px 8px;
    background: transparent;
    border: none;
    font-size: 13px;
    color: $text-secondary;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: $primary-color;
    }
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 10px 12px;
  background: rgba($error-color, 0.1);
  border: 1px solid rgba($error-color, 0.2);
  border-radius: 6px;
  font-size: 13px;
  color: $error-color;

  .error-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: $error-color;
    border-radius: 50%;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  background: #f9fafb;
  border-top: 1px solid $border-color;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-secondary {
    background: #ffffff;
    border: 1px solid $border-color;
    color: $text-primary;

    &:hover:not(:disabled) {
      background: #f3f4f6;
    }
  }

  &.btn-primary {
    background: $primary-color;
    border: none;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: $primary-dark;
    }
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
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;

  .modal-container {
    transition: all 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.9) translateY(-20px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
