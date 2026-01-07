<script setup lang="ts">
/**
 * 平台信息头部组件
 *
 * 显示已配置平台的状态信息和操作按钮
 */

import type { PlatformStatus, ApiKeyStorageType } from '@/types/platform'

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------

const props = defineProps<{
  platformName: string
  status: PlatformStatus
  storageType?: ApiKeyStorageType
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'reconfigure'): void
  (e: 'remove'): void
}>()

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

const getStatusColor = (status: PlatformStatus): string => {
  switch (status) {
    case 'valid':
      return '#22C55E'
    case 'invalid':
      return '#EF4444'
    default:
      return '#F59E0B'
  }
}

const getStatusText = (status: PlatformStatus): string => {
  switch (status) {
    case 'valid':
      return '正常'
    case 'invalid':
      return '已失效'
    default:
      return '未配置'
  }
}

const getStorageText = (type?: ApiKeyStorageType): string => {
  return type === 'local' ? '本地存储' : '服务器存储'
}
</script>

<template>
  <div class="platform-header">
    <div class="header-info">
      <h2 class="platform-name">{{ platformName }}</h2>
      <div class="platform-meta">
        <div class="status-badge" :style="{ '--status-color': getStatusColor(status) }">
          <span class="status-dot"></span>
          <span class="status-text">状态：{{ getStatusText(status) }}</span>
        </div>
        <div v-if="storageType" class="storage-info">
          存储方式：{{ getStorageText(storageType) }}
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="action-btn secondary"
        :disabled="loading"
        @click="emit('reconfigure')"
      >
        重新配置
      </button>
      <button
        type="button"
        class="action-btn danger"
        :disabled="loading"
        @click="emit('remove')"
      >
        移除平台
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;
$danger-color: #ef4444;
$danger-light: #fef2f2;

.platform-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
  gap: 24px;
}

.header-info {
  flex: 1;

  .platform-name {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
    color: $text-primary;
  }
}

.platform-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: $text-secondary;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--status-color);
    box-shadow: 0 0 4px var(--status-color);
  }
}

.storage-info {
  font-size: 14px;
  color: $text-secondary;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.secondary {
    background: #f3f4f6;
    border: 1px solid $border-color;
    color: $text-primary;

    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  }

  &.danger {
    background: $danger-light;
    border: 1px solid rgba($danger-color, 0.2);
    color: $danger-color;

    &:hover:not(:disabled) {
      background: rgba($danger-color, 0.1);
      border-color: rgba($danger-color, 0.3);
    }
  }
}

// 响应式
@media (max-width: 640px) {
  .platform-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;

    .action-btn {
      flex: 1;
    }
  }
}
</style>
