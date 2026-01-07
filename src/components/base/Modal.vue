<!--
============================================================================
文件名：Modal.vue
位置：src/components/base/Modal.vue
作用：基础模态框组件
为什么需要：
  1. 统一弹窗样式和交互
  2. 支持标题、内容、底部操作
  3. 可配置遮罩、关闭方式
============================================================================
-->

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'

/**
 * Props 定义
 */
interface Props {
  modelValue: boolean
  title?: string
  width?: string
  closable?: boolean
  maskClosable?: boolean
  showFooter?: boolean
  confirmText?: string
  cancelText?: string
  confirmLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '500px',
  closable: true,
  maskClosable: true,
  showFooter: true,
  confirmText: '确定',
  cancelText: '取消',
  confirmLoading: false,
})

/**
 * Emits 定义
 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
  close: []
}>()

/**
 * 关闭模态框
 */
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

/**
 * 点击遮罩
 */
const handleMaskClick = () => {
  if (props.maskClosable) {
    handleClose()
  }
}

/**
 * 确认
 */
const handleConfirm = () => {
  emit('confirm')
}

/**
 * 取消
 */
const handleCancel = () => {
  handleClose()
  emit('cancel')
}

/**
 * ESC 键关闭
 */
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue && props.closable) {
    handleClose()
  }
}

/**
 * 监听 ESC 键
 */
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      document.addEventListener('keydown', handleEscape)
      // 阻止页面滚动
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleEscape)
      // 恢复页面滚动
      document.body.style.overflow = ''
    }
  }
)

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="base-modal-wrapper">
        <!-- 遮罩层 -->
        <div class="base-modal-mask" @click="handleMaskClick"></div>

        <!-- 模态框主体 -->
        <div class="base-modal" :style="{ width }" @click.stop>
          <!-- 头部 -->
          <div class="base-modal__header">
            <div class="base-modal__title">
              <slot name="title">{{ title }}</slot>
            </div>
            <button v-if="closable" class="base-modal__close" @click="handleClose">✕</button>
          </div>

          <!-- 内容 -->
          <div class="base-modal__body">
            <slot />
          </div>

          <!-- 底部 -->
          <div v-if="showFooter" class="base-modal__footer">
            <slot name="footer">
              <button class="base-modal__button base-modal__button--cancel" @click="handleCancel">
                {{ cancelText }}
              </button>
              <button
                class="base-modal__button base-modal__button--confirm"
                :disabled="confirmLoading"
                @click="handleConfirm"
              >
                <span v-if="confirmLoading" class="loading-spinner"></span>
                <span>{{ confirmText }}</span>
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.base-modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.base-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.base-modal {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modal-in 0.3s ease;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.base-modal__title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.base-modal__close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.3s ease;

  &:hover {
    color: #333;
  }
}

.base-modal__body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  color: #666;
  line-height: 1.6;
}

.base-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
}

.base-modal__button {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--cancel {
    background: white;
    color: #666;
    border-color: #d9d9d9;

    &:hover:not(:disabled) {
      color: #333;
      border-color: #bfbfbf;
    }
  }

  &--confirm {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 动画过渡
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;

  .base-modal {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .base-modal {
    transform: scale(0.9) translateY(-20px);
    opacity: 0;
  }
}
</style>
