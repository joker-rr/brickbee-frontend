<!--
============================================================================
文件名：Card.vue
位置：src/components/base/Card.vue
作用：基础卡片组件
为什么需要：
  1. 统一卡片样式
  2. 支持标题、内容、底部插槽
  3. 可配置阴影和悬浮效果
============================================================================
-->

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 卡片阴影类型
 */
export type CardShadow = 'always' | 'hover' | 'never'

/**
 * Props 定义
 */
interface Props {
  shadow?: CardShadow
  bordered?: boolean
  hoverable?: boolean
  padding?: string
}

const props = withDefaults(defineProps<Props>(), {
  shadow: 'always',
  bordered: true,
  hoverable: false,
  padding: '20px',
})

/**
 * 卡片样式类
 */
const cardClass = computed(() => [
  'base-card',
  `base-card--shadow-${props.shadow}`,
  {
    'base-card--bordered': props.bordered,
    'base-card--hoverable': props.hoverable,
  },
])
</script>

<template>
  <div :class="cardClass" :style="{ padding }">
    <!-- 头部插槽 -->
    <div v-if="$slots.header" class="base-card__header">
      <slot name="header" />
    </div>

    <!-- 内容插槽 -->
    <div v-if="$slots.default" class="base-card__body">
      <slot />
    </div>

    <!-- 底部插槽 -->
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.base-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  // 阴影变体
  &--shadow-always {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &--shadow-hover {
    box-shadow: none;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  &--shadow-never {
    box-shadow: none;
  }

  // 边框
  &--bordered {
    border: 1px solid #e8e8e8;
  }

  // 悬浮效果
  &--hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
  }
}

.base-card__header {
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.base-card__body {
  color: #666;
  line-height: 1.6;
}

.base-card__footer {
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
  margin-top: 16px;
  color: #999;
  font-size: 14px;
}

// 当 header 存在时，body 需要上边距
.base-card__header + .base-card__body {
  margin-top: 16px;
}
</style>
