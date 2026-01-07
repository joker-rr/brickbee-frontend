<script setup lang="ts">
/**
 * 请求统计面板组件
 *
 * 功能：
 * 1. 显示请求统计（总数、成功、失败）
 * 2. 显示成功率
 * 3. 显示平均响应时间
 * 4. 显示限流状态
 */

import { computed } from 'vue'
import { useExecutionStore } from '@/stores/modules/execution'
import type { RequestStats } from '@/types/market-automation'

// Props
interface Props {
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false
})

// Store
const executionStore = useExecutionStore()

// 计算属性
const stats = computed(() => executionStore.stats)
const successRate = computed(() => executionStore.successRate)

const lastRequestTime = computed(() => {
  if (!stats.value.lastRequestAt) return '--'
  return formatTime(stats.value.lastRequestAt)
})

const rateLimitStatus = computed(() => stats.value.rateLimitStatus)

const rateLimitPercentage = computed(() => {
  if (!rateLimitStatus.value) return 100
  return Math.round((rateLimitStatus.value.remaining / rateLimitStatus.value.limit) * 100)
})

const rateLimitClass = computed(() => {
  const pct = rateLimitPercentage.value
  if (pct > 50) return 'good'
  if (pct > 20) return 'warning'
  return 'danger'
})

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 格式化响应时间
 */
function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * 重置统计
 */
function handleReset() {
  if (confirm('确定要重置统计数据吗？')) {
    executionStore.resetStats()
  }
}
</script>

<template>
  <div class="request-stats" :class="{ compact }">
    <div class="stats-header">
      <h4 class="stats-title">请求统计</h4>
      <button class="reset-btn" @click="handleReset" title="重置统计">
        🔄
      </button>
    </div>

    <!-- 主要统计 -->
    <div class="stats-grid" :class="{ 'compact-grid': compact }">
      <div class="stat-card total">
        <div class="stat-value">{{ stats.totalRequests }}</div>
        <div class="stat-label">总请求</div>
      </div>

      <div class="stat-card success">
        <div class="stat-value">{{ stats.successRequests }}</div>
        <div class="stat-label">成功</div>
      </div>

      <div class="stat-card failed">
        <div class="stat-value">{{ stats.failedRequests }}</div>
        <div class="stat-label">失败</div>
      </div>

      <div class="stat-card rate">
        <div class="stat-value">{{ successRate }}%</div>
        <div class="stat-label">成功率</div>
      </div>
    </div>

    <!-- 详细信息 -->
    <div v-if="!compact" class="stats-details">
      <div class="detail-row">
        <span class="detail-label">平均响应时间</span>
        <span class="detail-value">{{ formatResponseTime(stats.avgResponseTime) }}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">最后请求时间</span>
        <span class="detail-value">{{ lastRequestTime }}</span>
      </div>

      <!-- 限流状态 -->
      <div v-if="rateLimitStatus" class="rate-limit">
        <div class="rate-limit-header">
          <span class="rate-limit-label">API 限流状态</span>
          <span class="rate-limit-value" :class="rateLimitClass">
            {{ rateLimitStatus.remaining }} / {{ rateLimitStatus.limit }}
          </span>
        </div>
        <div class="rate-limit-bar">
          <div
            class="rate-limit-fill"
            :class="rateLimitClass"
            :style="{ width: `${rateLimitPercentage}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 成功率进度条 -->
    <div class="success-rate-bar">
      <div class="bar-track">
        <div
          class="bar-fill"
          :class="{
            good: successRate >= 90,
            warning: successRate >= 70 && successRate < 90,
            danger: successRate < 70
          }"
          :style="{ width: `${successRate}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-stats {
  padding: 16px;
  background-color: var(--bg-color-secondary, #f9fafb);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.request-stats.compact {
  padding: 12px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stats-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-primary, #1f2937);
  margin: 0;
}

.reset-btn {
  padding: 4px 8px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background-color: var(--bg-color-tertiary, #e5e7eb);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stats-grid.compact-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.compact .stat-card {
  padding: 8px 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color-primary, #1f2937);
}

.compact .stat-value {
  font-size: 16px;
}

.stat-card.success .stat-value {
  color: var(--success-color, #10b981);
}

.stat-card.failed .stat-value {
  color: var(--error-color, #ef4444);
}

.stat-card.rate .stat-value {
  color: var(--primary-color, #3b82f6);
}

.stat-label {
  font-size: 11px;
  color: var(--text-color-secondary, #6b7280);
  margin-top: 4px;
}

.stats-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 13px;
  color: var(--text-color-secondary, #6b7280);
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
}

.rate-limit {
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.rate-limit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rate-limit-label {
  font-size: 12px;
  color: var(--text-color-secondary, #6b7280);
}

.rate-limit-value {
  font-size: 13px;
  font-weight: 500;
}

.rate-limit-value.good {
  color: var(--success-color, #10b981);
}

.rate-limit-value.warning {
  color: var(--warning-color, #f59e0b);
}

.rate-limit-value.danger {
  color: var(--error-color, #ef4444);
}

.rate-limit-bar {
  height: 6px;
  background-color: var(--bg-color-tertiary, #e5e7eb);
  border-radius: 3px;
  overflow: hidden;
}

.rate-limit-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.rate-limit-fill.good {
  background-color: var(--success-color, #10b981);
}

.rate-limit-fill.warning {
  background-color: var(--warning-color, #f59e0b);
}

.rate-limit-fill.danger {
  background-color: var(--error-color, #ef4444);
}

.success-rate-bar {
  margin-top: 8px;
}

.bar-track {
  height: 4px;
  background-color: var(--bg-color-tertiary, #e5e7eb);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.bar-fill.good {
  background-color: var(--success-color, #10b981);
}

.bar-fill.warning {
  background-color: var(--warning-color, #f59e0b);
}

.bar-fill.danger {
  background-color: var(--error-color, #ef4444);
}
</style>
