<script setup lang="ts">
/**
 * 平台列表组件
 *
 * 显示所有支持的平台列表，支持切换和状态显示
 */

import { computed } from 'vue'
import { PlatformType } from '@/config/platform.config'
import type { PlatformStatus } from '@/types/platform'

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------

interface PlatformItem {
  type: PlatformType
  name: string
  label: string
  icon: string
  color: string
  status: PlatformStatus
  storageType?: 'server' | 'local'
}

const props = defineProps<{
  platforms: PlatformItem[]
  currentPlatform: PlatformType
}>()

const emit = defineEmits<{
  (e: 'select', platform: PlatformType): void
}>()

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

/**
 * 获取状态指示器颜色
 */
const getStatusColor = (status: PlatformStatus): string => {
  switch (status) {
    case 'valid':
      return '#22C55E' // 绿色
    case 'invalid':
      return '#EF4444' // 红色
    default:
      return '#F59E0B' // 橙色
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: PlatformStatus): string => {
  switch (status) {
    case 'valid':
      return '已配置'
    case 'invalid':
      return '已失效'
    default:
      return '未配置'
  }
}

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

const handleSelect = (platform: PlatformType) => {
  emit('select', platform)
}
</script>

<template>
  <div class="platform-list">
    <div class="list-header">
      <h3 class="list-title">平台列表</h3>
    </div>

    <div class="list-content">
      <div v-for="platform in platforms" :key="platform.type" class="platform-item"
        :class="{ active: currentPlatform === platform.type }" @click="handleSelect(platform.type)">
        <div class="platform-status">
          <span class="status-dot" :style="{ backgroundColor: getStatusColor(platform.status) }"></span>
        </div>

        <div class="platform-info">
          <span class="platform-name">{{ platform.name }}</span>
          <span class="platform-status-text">{{ getStatusText(platform.status) }}</span>
        </div>

        <div v-if="platform.storageType" class="storage-badge">
          {{ platform.storageType === 'server' ? '云端' : '本地' }}
        </div>
      </div>
    </div>

    <!-- 未来可添加的功能入口 -->
    <!-- <div class="list-footer">
      <button class="add-platform-btn">
        <span class="btn-icon">+</span>
        <span>添加平台</span>
      </button>
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$primary-dark: #5a5fcf;
$primary-light: #eef0ff;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;
$background-color: #f7f8fc;

.platform-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
  overflow: hidden;
}

.list-header {
  padding: 20px 16px;
  border-bottom: 1px solid $border-color;

  .list-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.platform-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: $primary-light;
  }

  &.active {
    background: $primary-color;

    .platform-name {
      color: #ffffff;
    }

    .platform-status-text {
      color: rgba(255, 255, 255, 0.8);
    }

    .storage-badge {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
  }
}

.platform-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-shadow: 0 0 4px currentColor;
  }
}

.platform-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .platform-name {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .platform-status-text {
    font-size: 12px;
    color: $text-secondary;
  }
}

.storage-badge {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: $primary-color;
  background: $primary-light;
  border-radius: 4px;
  white-space: nowrap;
}

.list-footer {
  padding: 12px 16px;
  border-top: 1px solid $border-color;

  .add-platform-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 40px;
    background: transparent;
    border: 2px dashed $border-color;
    border-radius: 8px;
    color: $text-secondary;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $primary-color;
      color: $primary-color;
      background: $primary-light;
    }

    .btn-icon {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

// 滚动条样式
.list-content {
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $border-color;
    border-radius: 2px;

    &:hover {
      background: #d0d3dc;
    }
  }
}
</style>
