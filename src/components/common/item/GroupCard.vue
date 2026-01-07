<script setup lang="ts">
/**
 * 分组卡片组件
 *
 * 用于分组模式下显示一组相同物品，支持：
 * - 分组头部（图标、名称、数量、展开按钮）
 * - 预览卡片（收起状态下显示）
 * - 展开的物品列表
 */

import { computed } from 'vue'
import type { BaseItem } from './types'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  groupName: string
  items: BaseItem[]
  expanded?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  loading: false
})

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const firstItem = computed(() => props.items[0])
const itemCount = computed(() => props.items.length)

const handleToggle = () => {
  emit('toggle')
}
</script>

<template>
  <div class="group-card" :class="{ expanded }">
    <!-- 分组头部 -->
    <div class="group-header" @click="handleToggle">
      <div class="group-info">
        <div class="group-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M12 13L2 8v2l10 5 10-5V8l-10 5z" />
            <path d="M12 18L2 13v2l10 5 10-5v-2l-10 5z" />
          </svg>
        </div>
        <div class="group-details">
          <div class="group-name">{{ groupName }}</div>
          <div class="group-count">{{ itemCount }}件物品</div>
        </div>
      </div>
      <button type="button" class="toggle-btn" :class="{ expanded }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z" />
        </svg>
        {{ expanded ? '收起' : '展开' }}
      </button>
    </div>

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" size="small" />

    <!-- 预览/展开内容 -->
    <template v-else>
      <!-- 收起状态 - 显示预览 -->
      <div v-if="!expanded" class="preview-content">
        <slot name="preview" :item="firstItem" :count="itemCount" />
      </div>

      <!-- 展开状态 - 显示所有物品 -->
      <div v-else class="expanded-content">
        <slot name="expanded" :items="items" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.group-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
  }

  .group-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .group-icon {
      color: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .group-details {
      .group-name {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .group-count {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }
    }
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: #e2e8f0;
    }

    &.expanded {
      background-color: #dbeafe;
      border-color: #3b82f6;
      color: #1e40af;

      svg {
        transform: rotate(180deg);
      }
    }

    svg {
      transition: transform 0.2s ease;
    }
  }
}

.preview-content,
.expanded-content {
  padding: 0;
}

.expanded-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 12px;
  background-color: #f8fafc;

  // 美化滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}
</style>