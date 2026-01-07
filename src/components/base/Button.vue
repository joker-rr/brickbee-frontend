<!--
============================================================================
文件名：Button.vue
位置：src/components/base/Button.vue
作用：基础按钮组件
为什么需要：
  1. 统一按钮样式和交互
  2. 支持多种类型和尺寸
  3. 可复用，易于维护
============================================================================
-->

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 按钮类型
 */
export type ButtonType = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'

/**
 * 按钮尺寸
 */
export type ButtonSize = 'small' | 'medium' | 'large'

/**
 * Props 定义
 */
interface Props {
  type?: ButtonType
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  round?: boolean
  plain?: boolean
  block?: boolean
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  round: false,
  plain: false,
  block: false,
})

/**
 * Emits 定义
 */
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

/**
 * 按钮样式类
 */
const buttonClass = computed(() => [
  'base-button',
  `base-button--${props.type}`,
  `base-button--${props.size}`,
  {
    'base-button--disabled': props.disabled || props.loading,
    'base-button--loading': props.loading,
    'base-button--round': props.round,
    'base-button--plain': props.plain,
    'base-button--block': props.block,
  },
])

/**
 * 点击事件处理
 */
const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button :class="buttonClass" :disabled="disabled || loading" @click="handleClick">
    <!-- Loading 图标 -->
    <span v-if="loading" class="base-button__loading">
      <span class="loading-spinner"></span>
    </span>

    <!-- 自定义图标 -->
    <span v-if="icon && !loading" class="base-button__icon">{{ icon }}</span>

    <!-- 按钮内容 -->
    <span v-if="$slots.default" class="base-button__content">
      <slot />
    </span>
  </button>
</template>

<style lang="scss" scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
  outline: none;

  // 尺寸变体
  &--small {
    padding: 6px 12px;
    font-size: 12px;
  }

  &--medium {
    padding: 10px 20px;
    font-size: 14px;
  }

  &--large {
    padding: 14px 32px;
    font-size: 16px;
  }

  // 类型变体
  &--primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: #667eea;

    &:hover:not(.base-button--disabled) {
      background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    &.base-button--plain {
      background: transparent;
      color: #667eea;
      border-color: #667eea;

      &:hover:not(.base-button--disabled) {
        background: rgba(102, 126, 234, 0.1);
      }
    }
  }

  &--secondary {
    background: #f5f5f5;
    color: #333;
    border-color: #d9d9d9;

    &:hover:not(.base-button--disabled) {
      background: #e8e8e8;
      border-color: #bfbfbf;
    }

    &.base-button--plain {
      background: transparent;
      color: #666;

      &:hover:not(.base-button--disabled) {
        background: rgba(0, 0, 0, 0.05);
      }
    }
  }

  &--success {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    color: white;
    border-color: #52c41a;

    &:hover:not(.base-button--disabled) {
      background: linear-gradient(135deg, #49aa17 0%, #2f7d0a 100%);
      box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
    }

    &.base-button--plain {
      background: transparent;
      color: #52c41a;
      border-color: #52c41a;

      &:hover:not(.base-button--disabled) {
        background: rgba(82, 196, 26, 0.1);
      }
    }
  }

  &--warning {
    background: linear-gradient(135deg, #faad14 0%, #fa8c16 100%);
    color: white;
    border-color: #faad14;

    &:hover:not(.base-button--disabled) {
      background: linear-gradient(135deg, #e09b12 0%, #e07c13 100%);
      box-shadow: 0 4px 12px rgba(250, 173, 20, 0.3);
    }

    &.base-button--plain {
      background: transparent;
      color: #faad14;
      border-color: #faad14;

      &:hover:not(.base-button--disabled) {
        background: rgba(250, 173, 20, 0.1);
      }
    }
  }

  &--danger {
    background: linear-gradient(135deg, #f5222d 0%, #cf1322 100%);
    color: white;
    border-color: #f5222d;

    &:hover:not(.base-button--disabled) {
      background: linear-gradient(135deg, #d91f2a 0%, #b4101f 100%);
      box-shadow: 0 4px 12px rgba(245, 34, 45, 0.3);
    }

    &.base-button--plain {
      background: transparent;
      color: #f5222d;
      border-color: #f5222d;

      &:hover:not(.base-button--disabled) {
        background: rgba(245, 34, 45, 0.1);
      }
    }
  }

  &--info {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
    border-color: #1890ff;

    &:hover:not(.base-button--disabled) {
      background: linear-gradient(135deg, #1580e6 0%, #0761c2 100%);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    }

    &.base-button--plain {
      background: transparent;
      color: #1890ff;
      border-color: #1890ff;

      &:hover:not(.base-button--disabled) {
        background: rgba(24, 144, 255, 0.1);
      }
    }
  }

  // 圆角
  &--round {
    border-radius: 50px;
  }

  // 块级按钮
  &--block {
    width: 100%;
    display: flex;
  }

  // 禁用状态
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // Loading 状态
  &--loading {
    cursor: wait;
  }

  // 点击效果
  &:active:not(.base-button--disabled) {
    transform: translateY(1px);
  }
}

.base-button__loading,
.base-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
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
