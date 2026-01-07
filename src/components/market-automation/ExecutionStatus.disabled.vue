<script setup lang="ts">
/**
 * 执行会话状态显示组件
 *
 * 功能：
 * 1. 显示会话状态（活跃/过期/错误）
 * 2. 显示剩余时间
 * 3. 显示请求统计
 * 4. 提供关闭会话按钮
 */

import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useExecutionStore } from '@/stores/modules/execution'
import { executionSessionManager } from '@/composables/platform-access'
import { PlatformType } from '@/config/platform.config'

// Props
interface Props {
  showDetails?: boolean
}

withDefaults(defineProps<Props>(), {
  showDetails: true
})

// Emits
const emit = defineEmits<{
  'close-session': []
  'refresh-session': []
}>()

// Stores
const executionStore = useExecutionStore()

// 定时器
const updateTimer = ref<ReturnType<typeof setInterval> | null>(null)
const displayTime = ref('')

// 计算属性
const session = computed(() => executionStore.currentSession)
const isActive = computed(() => executionStore.isSessionActive)
const isExpired = computed(() => executionStore.isSessionExpired)
const stats = computed(() => executionStore.stats)
const successRate = computed(() => executionStore.successRate)

const statusClass = computed(() => {
  if (!session.value) return 'idle'
  switch (session.value.status) {
    case 'active':
      return 'active'
    case 'expired':
      return 'expired'
    case 'error':
      return 'error'
    default:
      return 'idle'
  }
})

const statusText = computed(() => {
  if (!session.value) return '未激活'
  switch (session.value.status) {
    case 'active':
      return '已激活'
    case 'created':
      return '已创建'
    case 'expired':
      return '已过期'
    case 'error':
      return '错误'
    default:
      return '空闲'
  }
})

/**
 * 格式化剩余时间
 */
function formatTimeRemaining(): string {
  if (!session.value) return '--:--:--'

  const remaining = Math.max(0, session.value.expiresAt - Date.now())

  if (remaining === 0) return '已过期'

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 更新显示时间
 */
function updateDisplayTime() {
  displayTime.value = formatTimeRemaining()
}

/**
 * 关闭会话
 */
async function handleCloseSession() {
  if (confirm('确定要关闭执行会话吗？')) {
    const platform = session.value?.platform
    if (platform) {
      await executionSessionManager.destroySession(platform)
    }
    executionStore.clearSession()
    emit('close-session')
  }
}

/**
 * 刷新会话
 */
async function handleRefreshSession() {
  const platform = session.value?.platform
  if (platform) {
    await executionSessionManager.refreshSession(platform)
  }
  emit('refresh-session')
}

/**
 * 获取平台名称
 */
function getPlatformName(platform: PlatformType): string {
  const names: Record<PlatformType, string> = {
    [PlatformType.MARKET]: 'Market',
    [PlatformType.CSGOBUY]: 'CSGOBUY',
    [PlatformType.BUFF]: 'BUFF'
  }
  return names[platform] || platform
}

// 生命周期
onMounted(() => {
  updateDisplayTime()
  updateTimer.value = setInterval(updateDisplayTime, 1000)
})

onUnmounted(() => {
  if (updateTimer.value) {
    clearInterval(updateTimer.value)
  }
})
</script>

<template>
  <div class="execution-status" :class="statusClass">
    <!-- 状态指示器 -->
    <div class="status-indicator">
      <span class="status-dot" :class="statusClass"></span>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <template v-if="session">
      <!-- 平台信息 -->
      <div class="session-info">
        <div class="info-row">
          <span class="info-label">平台</span>
          <span class="info-value">{{ getPlatformName(session.platform) }}</span>
        </div>

        <div class="info-row">
          <span class="info-label">剩余时间</span>
          <span class="info-value time" :class="{ warning: executionStore.sessionTimeRemaining < 10 * 60 * 1000 }">
            {{ displayTime }}
          </span>
        </div>

        <div class="info-row">
          <span class="info-label">请求计数</span>
          <span class="info-value">{{ session.requestCount }}</span>
        </div>
      </div>

      <!-- 详细统计 -->
      <div v-if="showDetails" class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ stats.totalRequests }}</span>
            <span class="stat-label">总请求</span>
          </div>
          <div class="stat-item success">
            <span class="stat-value">{{ stats.successRequests }}</span>
            <span class="stat-label">成功</span>
          </div>
          <div class="stat-item error">
            <span class="stat-value">{{ stats.failedRequests }}</span>
            <span class="stat-label">失败</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ successRate }}%</span>
            <span class="stat-label">成功率</span>
          </div>
        </div>

        <div class="avg-response">
          <span class="avg-label">平均响应时间</span>
          <span class="avg-value">{{ stats.avgResponseTime }}ms</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button
          v-if="isActive"
          class="btn btn-text"
          @click="handleRefreshSession"
        >
          刷新会话
        </button>
        <button
          class="btn btn-text btn-danger"
          @click="handleCloseSession"
        >
          关闭会话
        </button>
      </div>
    </template>

    <template v-else>
      <div class="no-session">
        <span class="no-session-text">暂无活跃的执行会话</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.execution-status {
  padding: 16px;
  background-color: var(--bg-color-secondary, #f9fafb);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.execution-status.active {
  border-color: var(--success-color, #10b981);
  background-color: rgba(16, 185, 129, 0.05);
}

.execution-status.expired,
.execution-status.error {
  border-color: var(--error-color, #ef4444);
  background-color: rgba(239, 68, 68, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--text-color-secondary, #6b7280);
}

.status-dot.active {
  background-color: var(--success-color, #10b981);
  animation: pulse 2s infinite;
}

.status-dot.expired,
.status-dot.error {
  background-color: var(--error-color, #ef4444);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-primary, #1f2937);
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: var(--text-color-secondary, #6b7280);
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
}

.info-value.time {
  font-family: 'Courier New', monospace;
}

.info-value.time.warning {
  color: var(--warning-color, #f59e0b);
}

.stats-section {
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary, #1f2937);
}

.stat-item.success .stat-value {
  color: var(--success-color, #10b981);
}

.stat-item.error .stat-value {
  color: var(--error-color, #ef4444);
}

.stat-label {
  font-size: 11px;
  color: var(--text-color-secondary, #6b7280);
}

.avg-response {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--bg-color-tertiary, #f3f4f6);
  border-radius: 6px;
}

.avg-label {
  font-size: 12px;
  color: var(--text-color-secondary, #6b7280);
}

.avg-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-text {
  background: none;
  color: var(--text-color-secondary, #6b7280);
}

.btn-text:hover {
  background-color: var(--bg-color-tertiary, #e5e7eb);
}

.btn-danger {
  color: var(--error-color, #ef4444);
}

.btn-danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.no-session {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.no-session-text {
  font-size: 14px;
  color: var(--text-color-secondary, #6b7280);
}
</style>
