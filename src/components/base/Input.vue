<!--
============================================================================
文件名：Input.vue
位置：src/components/base/Input.vue
作用：基础输入框组件
为什么需要：
  1. 统一输入框样式
  2. 支持多种类型和状态
  3. 内置验证错误显示
============================================================================
-->

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * 输入框类型
 */
export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'

/**
 * 输入框尺寸
 */
export type InputSize = 'small' | 'medium' | 'large'

/**
 * Props 定义
 */
interface Props {
  modelValue: string | number
  type?: InputType
  size?: InputSize
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  showPassword?: boolean
  error?: string
  maxlength?: number
  prefix?: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'medium',
  placeholder: '',
  disabled: false,
  readonly: false,
  clearable: false,
  showPassword: false,
})

/**
 * Emits 定义
 */
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  clear: []
}>()

/**
 * 是否显示密码
 */
const passwordVisible = ref(false)

/**
 * 实际输入框类型
 */
const actualType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text'
  }
  return props.type
})

/**
 * 输入框样式类
 */
const inputClass = computed(() => [
  'base-input',
  `base-input--${props.size}`,
  {
    'base-input--disabled': props.disabled,
    'base-input--error': props.error,
    'base-input--prefix': props.prefix,
    'base-input--suffix': props.suffix || props.clearable || props.showPassword,
  },
])

/**
 * 输入事件处理
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

/**
 * 清空输入
 */
const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}

/**
 * 切换密码可见性
 */
const togglePasswordVisible = () => {
  passwordVisible.value = !passwordVisible.value
}
</script>

<template>
  <div class="base-input-wrapper">
    <div :class="inputClass">
      <!-- 前缀图标 -->
      <span v-if="prefix" class="base-input__prefix">{{ prefix }}</span>

      <!-- 输入框 -->
      <input
        :type="actualType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        class="base-input__inner"
        @input="handleInput"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />

      <!-- 后缀操作 -->
      <div v-if="clearable || showPassword || suffix" class="base-input__suffix">
        <!-- 清空按钮 -->
        <span
          v-if="clearable && modelValue && !disabled"
          class="base-input__clear"
          @click="handleClear"
        >
          ✕
        </span>

        <!-- 密码可见性切换 -->
        <span
          v-if="showPassword && type === 'password'"
          class="base-input__password-toggle"
          @click="togglePasswordVisible"
        >
          {{ passwordVisible ? '👁️' : '👁️‍🗨️' }}
        </span>

        <!-- 后缀图标 -->
        <span v-if="suffix" class="base-input__suffix-icon">{{ suffix }}</span>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="base-input__error">
      {{ error }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.base-input-wrapper {
  width: 100%;
}

.base-input {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover:not(.base-input--disabled) {
    border-color: #667eea;
  }

  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }

  // 尺寸变体
  &--small {
    .base-input__inner {
      padding: 6px 12px;
      font-size: 12px;
    }
  }

  &--medium {
    .base-input__inner {
      padding: 10px 15px;
      font-size: 14px;
    }
  }

  &--large {
    .base-input__inner {
      padding: 14px 20px;
      font-size: 16px;
    }
  }

  // 禁用状态
  &--disabled {
    background: #f5f5f5;
    cursor: not-allowed;

    .base-input__inner {
      cursor: not-allowed;
    }
  }

  // 错误状态
  &--error {
    border-color: #f5222d;

    &:focus-within {
      box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.1);
    }
  }

  // 有前缀时
  &--prefix {
    .base-input__inner {
      padding-left: 0;
    }
  }

  // 有后缀时
  &--suffix {
    .base-input__inner {
      padding-right: 0;
    }
  }
}

.base-input__inner {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #333;
  font-size: 14px;
  line-height: 1.5;

  &::placeholder {
    color: #bfbfbf;
  }

  &:disabled {
    color: #bfbfbf;
  }
}

.base-input__prefix,
.base-input__suffix {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  color: #999;
  font-size: 14px;
}

.base-input__suffix {
  gap: 8px;
}

.base-input__clear,
.base-input__password-toggle {
  cursor: pointer;
  color: #999;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: #667eea;
  }
}

.base-input__error {
  margin-top: 4px;
  font-size: 12px;
  color: #f5222d;
  line-height: 1.5;
}
</style>
