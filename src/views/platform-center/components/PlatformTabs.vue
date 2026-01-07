<script setup lang="ts">
/**
 * 平台功能 Tab 组件
 */

import type { PlatformTabType } from '@/types/platform'

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------

const props = defineProps<{
  currentTab: PlatformTabType
}>()

const emit = defineEmits<{
  (e: 'change', tab: PlatformTabType): void
}>()

// --------------------------------------------------------------------------
// Data
// --------------------------------------------------------------------------

interface TabItem {
  key: PlatformTabType
  label: string
}

const tabs: TabItem[] = [
  { key: 'inventory', label: '库存' },
  { key: 'selling', label: '在售' },
  { key: 'history', label: '销售记录' },
  { key: 'automation', label: '自动化' }
]
</script>

<template>
  <div class="platform-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="tab-item"
      :class="{ active: currentTab === tab.key }"
      @click="emit('change', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;

.platform-tabs {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 8px;
}

.tab-item {
  flex: 1;
  height: 40px;
  padding: 0 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover:not(.active) {
    color: $text-primary;
    background: rgba(255, 255, 255, 0.5);
  }

  &.active {
    background: #ffffff;
    color: $primary-color;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 2px;
      background: $primary-color;
      border-radius: 1px;
    }
  }
}

// 响应式
@media (max-width: 480px) {
  .tab-item {
    padding: 0 12px;
    font-size: 13px;
  }
}
</style>
