<script setup lang="ts">
/**
 * 库存工具栏组件
 *
 * 包含搜索、筛选、模式切换等功能
 */

import { ref, computed, watch } from 'vue'
import type { DisplayMode } from '@/types/inventory'

// Props
const props = defineProps<{
  totalCount: number
  displayMode: DisplayMode
  groupCount?: number
  loading?: boolean
  selectedCount?: number
  batchMode?: boolean
  platformName?: string
  exchangeRate?: number
  showExchangeRate?: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'search', value: string): void
  (e: 'toggle-mode'): void
  (e: 'refresh'): void
  (e: 'toggle-batch'): void
  (e: 'select-all'): void
  (e: 'clear-selection'): void
  (e: 'exchange-rate-change', value: number): void
}>()

// 搜索防抖
const searchValue = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// 监听搜索值变化
watch(searchValue, value => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emit('search', value)
  }, 300)
})

// Computed
const modeText = computed(() => {
  return props.displayMode === 'expanded' ? '分组显示' : '全部展开'
})

const countText = computed(() => {
  if (props.displayMode === 'grouped' && props.groupCount) {
    return `${props.groupCount} 组 / ${props.totalCount} 件`
  }
  return `${props.totalCount} 件`
})

// Methods
function handleRefresh(): void {
  emit('refresh')
}

function handleToggleMode(): void {
  emit('toggle-mode')
}

function handleToggleBatch(): void {
  emit('toggle-batch')
}

function handleSelectAll(): void {
  emit('select-all')
}

function handleClearSelection(): void {
  emit('clear-selection')
}

function handleExchangeRateChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  if (!isNaN(value) && value > 0) {
    emit('exchange-rate-change', value)
  }
}
</script>

<template>
  <div class="inventory-toolbar">
    <div class="toolbar-left">
      <!-- 统计信息 -->
      <div class="stats-info">
        <span class="stats-platform">{{ platformName || '库存' }}</span>
        <span class="stats-count">{{ countText }}</span>
      </div>

      <!-- 搜索框 -->
      <div class="search-wrapper">
        <input
          v-model="searchValue"
          type="text"
          class="search-input"
          placeholder="搜索物品名称..."
        />
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>

    <div class="toolbar-right">
      <!-- 汇率显示（仅MARKET） -->
      <div v-if="showExchangeRate" class="exchange-rate">
        <label class="rate-label">汇率</label>
        <input
          type="number"
          class="rate-input"
          :value="exchangeRate"
          step="0.01"
          min="0"
          @change="handleExchangeRateChange"
        />
      </div>

      <!-- 批量操作 -->
      <template v-if="batchMode">
        <span class="selected-count">已选 {{ selectedCount || 0 }} 件</span>
        <button class="toolbar-btn" @click="handleSelectAll">全选</button>
        <button class="toolbar-btn" @click="handleClearSelection">取消</button>
        <button class="toolbar-btn primary" @click="handleToggleBatch">退出批量</button>
      </template>
      <template v-else>
        <button class="toolbar-btn" @click="handleToggleBatch">批量操作</button>
      </template>

      <!-- 模式切换 -->
      <button class="toolbar-btn" @click="handleToggleMode">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path v-if="displayMode === 'grouped'" d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
          <path v-else d="M4 5h4v4H4V5zm6 0h4v4h-4V5zm6 0h4v4h-4V5zm-12 6h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zm-12 6h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
        </svg>
        {{ modeText }}
      </button>

      <!-- 刷新按钮 -->
      <button class="toolbar-btn refresh-btn" :disabled="loading" @click="handleRefresh">
        <svg
          class="refresh-icon"
          :class="{ spinning: loading }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        刷新
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #6e72e5;
$primary-light: #eef0ff;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;

.inventory-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-info {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .stats-platform {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .stats-count {
    font-size: 14px;
    color: $text-secondary;
  }
}

.search-wrapper {
  position: relative;

  .search-input {
    width: 220px;
    padding: 8px 12px 8px 36px;
    font-size: 14px;
    border: 1px solid $border-color;
    border-radius: 8px;
    transition: all 0.2s;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
    }
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exchange-rate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-right: 1px solid $border-color;

  .rate-label {
    font-size: 12px;
    color: $text-secondary;
  }

  .rate-input {
    width: 60px;
    padding: 4px 8px;
    font-size: 13px;
    font-weight: 600;
    color: $primary-color;
    border: 1px solid $border-color;
    border-radius: 4px;

    &:focus {
      outline: none;
      border-color: $primary-color;
    }
  }
}

.selected-count {
  font-size: 13px;
  font-weight: 500;
  color: $primary-color;
  padding-right: 8px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  background: #f8fafc;
  border: 1px solid $border-color;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: $primary-light;
    border-color: rgba($primary-color, 0.2);
    color: $primary-color;

    &:hover {
      background: rgba($primary-color, 0.15);
    }
  }
}

.refresh-btn {
  .refresh-icon {
    transition: transform 0.3s ease;

    &.spinning {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .inventory-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    flex-wrap: wrap;
    justify-content: center;
  }

  .search-wrapper .search-input {
    width: 100%;
  }
}
</style>
