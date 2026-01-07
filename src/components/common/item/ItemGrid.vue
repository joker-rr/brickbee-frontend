<script setup lang="ts">
/**
 * 物品网格容器组件
 *
 * 用于以网格方式显示物品列表，支持：
 * - 展开模式（所有物品平铺）
 * - 分组模式（按名称分组）
 * - 加载状态
 * - 空状态
 */

import { computed } from 'vue'
import type { BaseItem, DisplayMode } from './types'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  items: BaseItem[]
  displayMode?: DisplayMode
  loading?: boolean
  emptyText?: string
  emptyIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'expanded',
  loading: false,
  emptyText: '暂无数据',
  emptyIcon: '&#x1F4E6;'
})

defineEmits<{
  (e: 'refresh'): void
}>()

const isEmpty = computed(() => !props.loading && props.items.length === 0)
</script>

<template>
  <div class="item-grid-container">
    <!-- 加载状态 -->
    <LoadingSpinner
      v-if="loading && items.length === 0"
      size="large"
      text="正在加载..."
    />

    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="empty-state">
      <div class="empty-icon" v-html="emptyIcon"></div>
      <p class="empty-text">{{ emptyText }}</p>
      <slot name="empty-action">
        <button type="button" class="refresh-btn" @click="$emit('refresh')">
          <span class="refresh-icon">&#x21bb;</span>
          刷新数据
        </button>
      </slot>
    </div>

    <!-- 网格内容 -->
    <div v-else class="item-grid" :class="`mode-${displayMode}`">
      <slot :items="items" :mode="displayMode" />
    </div>

    <!-- 加载更多指示器 -->
    <div v-if="loading && items.length > 0" class="loading-more">
      <div class="loading-spinner-small"></div>
      <span>正在更新...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item-grid-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.item-grid {
  display: grid;
  gap: 20px;

  &.mode-expanded {
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  }

  &.mode-grouped {
    grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e6e8f0;
  gap: 12px;
  text-align: center;

  .empty-icon {
    font-size: 56px;
    opacity: 0.6;
  }

  .empty-text {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #6b7280;
  }
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 20px;
  background: #6e72e5;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5a5eca;
    transform: translateY(-1px);
  }

  .refresh-icon {
    font-size: 16px;
  }
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  font-size: 13px;
  color: #6b7280;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(110, 114, 229, 0.2);
  border-top-color: #6e72e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式
@media (max-width: 768px) {
  .item-grid {
    &.mode-expanded,
    &.mode-grouped {
      grid-template-columns: 1fr;
    }
  }
}
</style>