<script setup lang="ts">
/**
 * 销售记录 Tab 组件
 */

import { ref, computed } from 'vue'
import type { SellHistoryItem, TimeRange } from '@/types/platform'

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------

const props = defineProps<{
  items: SellHistoryItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'filter-change', range: TimeRange): void
}>()

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------

const selectedTimeRange = ref<TimeRange>('7days')

// --------------------------------------------------------------------------
// Data
// --------------------------------------------------------------------------

interface TimeRangeOption {
  key: TimeRange
  label: string
}

const timeRangeOptions: TimeRangeOption[] = [
  { key: 'today', label: '今天' },
  { key: '7days', label: '7天' },
  { key: '30days', label: '30天' },
  { key: 'all', label: '全部' }
]

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

const totalSales = computed(() => props.items.length)

const totalProfit = computed(() => {
  return props.items.reduce((sum, item) => sum + (item.profit || 0), 0)
})

const totalRevenue = computed(() => {
  return props.items.reduce((sum, item) => sum + item.sellPrice, 0)
})

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

const formatPrice = (price: number | undefined): string => {
  if (price === undefined) return '-'
  return `${price.toFixed(2)}`
}

const formatProfit = (profit: number | undefined): string => {
  if (profit === undefined) return '-'
  const prefix = profit >= 0 ? '+' : ''
  return `${prefix}${profit.toFixed(2)}`
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const getProfitClass = (profit: number | undefined): string => {
  if (profit === undefined) return ''
  return profit >= 0 ? 'profit-positive' : 'profit-negative'
}

const changeTimeRange = (range: TimeRange) => {
  selectedTimeRange.value = range
  emit('filter-change', range)
}
</script>

<template>
  <div class="sell-history-tab">
    <!-- 头部统计和操作 -->
    <div class="tab-header">
      <div class="stats">
        <div class="stat-item">
          <span class="stat-value">{{ totalSales }}</span>
          <span class="stat-label">笔交易</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatPrice(totalRevenue) }}</span>
          <span class="stat-label">总收入</span>
        </div>
        <div class="stat-item" :class="getProfitClass(totalProfit)">
          <span class="stat-value">{{ formatProfit(totalProfit) }}</span>
          <span class="stat-label">总利润</span>
        </div>
      </div>

      <div class="header-actions">
        <div class="time-filter">
          <button
            v-for="option in timeRangeOptions"
            :key="option.key"
            type="button"
            class="filter-btn"
            :class="{ active: selectedTimeRange === option.key }"
            @click="changeTimeRange(option.key)"
          >
            {{ option.label }}
          </button>
        </div>

        <button type="button" class="refresh-btn" :disabled="loading" @click="emit('refresh')">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else class="refresh-icon">&#x21bb;</span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner large"></div>
      <span>正在加载销售记录...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="items.length === 0" class="empty-state">
      <span class="empty-icon">&#x1F4CA;</span>
      <p class="empty-text">暂无销售记录</p>
    </div>

    <!-- 销售记录列表 -->
    <div v-else class="history-list">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-item">饰品名</th>
            <th class="col-price">成交价</th>
            <th class="col-time">时间</th>
            <th class="col-profit">利润</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td class="col-item">
              <div class="item-info">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="item-image"
                />
                <span class="item-name">{{ item.name || item.marketHashName }}</span>
              </div>
            </td>
            <td class="col-price">{{ formatPrice(item.sellPrice) }}</td>
            <td class="col-time">{{ formatDate(item.soldAt) }}</td>
            <td class="col-profit" :class="getProfitClass(item.profit)">
              {{ formatProfit(item.profit) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$primary-light: #eef0ff;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;
$success-color: #22c55e;
$danger-color: #ef4444;

.sell-history-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
  gap: 16px;
  flex-wrap: wrap;
}

.stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: $primary-color;
  }

  .stat-label {
    font-size: 14px;
    color: $text-secondary;
  }

  &.profit-positive .stat-value {
    color: $success-color;
  }

  &.profit-negative .stat-value {
    color: $danger-color;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-filter {
  display: flex;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 8px;
}

.filter-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.active) {
    color: $text-primary;
  }

  &.active {
    background: #ffffff;
    color: $primary-color;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: $primary-light;
  border: 1px solid rgba($primary-color, 0.2);
  border-radius: 8px;
  color: $primary-color;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba($primary-color, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-icon {
    font-size: 16px;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
  gap: 16px;
  color: $text-secondary;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba($primary-color, 0.2);
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  &.large {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  margin: 0;
  font-size: 16px;
}

.history-list {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid $border-color;
  }

  th {
    background: #f9fafb;
    font-size: 13px;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    font-size: 14px;
    color: $text-primary;
  }

  tbody tr {
    transition: background 0.15s ease;

    &:hover {
      background: #f9fafb;
    }

    &:last-child td {
      border-bottom: none;
    }
  }
}

.col-item {
  width: 45%;
}

.col-price,
.col-time,
.col-profit {
  width: 18%;
  text-align: center;
}

.col-profit {
  &.profit-positive {
    color: $success-color;
    font-weight: 600;
  }

  &.profit-negative {
    color: $danger-color;
    font-weight: 600;
  }
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .item-image {
    width: 44px;
    height: 44px;
    object-fit: contain;
    border-radius: 6px;
    background: #f3f4f6;
  }

  .item-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
  }
}

// 响应式
@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats {
    width: 100%;
    justify-content: space-between;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .data-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
