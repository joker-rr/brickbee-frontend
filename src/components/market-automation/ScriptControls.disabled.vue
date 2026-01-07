<script setup lang="ts">
/**
 * 脚本控制组件
 *
 * 功能：
 * 1. 启动/暂停/停止脚本
 * 2. 配置执行间隔
 * 3. 显示运行状态
 */

import { ref, computed, watch } from 'vue'
import { useExecutionStore } from '@/stores/modules/execution'
import type { ScriptStatus, ScriptConfig } from '@/types/market-automation'

// Emits
const emit = defineEmits<{
  'start': []
  'pause': []
  'resume': []
  'stop': []
  'config-change': [config: Partial<ScriptConfig>]
}>()

// Store
const executionStore = useExecutionStore()

// 状态
const interval = ref(executionStore.scriptConfig.interval)
const showConfig = ref(false)

// 计算属性
const status = computed(() => executionStore.scriptStatus)
const isRunning = computed(() => executionStore.isScriptRunning)
const isPaused = computed(() => executionStore.isScriptPaused)
const isSessionActive = computed(() => executionStore.isSessionActive)

const canStart = computed(() => isSessionActive.value && !isRunning.value && !isPaused.value)
const canPause = computed(() => isRunning.value)
const canResume = computed(() => isPaused.value)
const canStop = computed(() => isRunning.value || isPaused.value)

const statusText = computed(() => {
  switch (status.value) {
    case 'running':
      return '运行中'
    case 'paused':
      return '已暂停'
    case 'stopped':
      return '已停止'
    case 'error':
      return '错误'
    default:
      return '空闲'
  }
})

const statusClass = computed(() => {
  switch (status.value) {
    case 'running':
      return 'running'
    case 'paused':
      return 'paused'
    case 'error':
      return 'error'
    default:
      return 'idle'
  }
})

/**
 * 启动脚本
 */
function handleStart() {
  if (!canStart.value) return
  emit('start')
}

/**
 * 暂停脚本
 */
function handlePause() {
  if (!canPause.value) return
  emit('pause')
}

/**
 * 恢复脚本
 */
function handleResume() {
  if (!canResume.value) return
  emit('resume')
}

/**
 * 停止脚本
 */
function handleStop() {
  if (!canStop.value) return
  emit('stop')
}

/**
 * 更新间隔配置
 */
function handleIntervalChange() {
  // 确保最小间隔为 300ms
  if (interval.value < 300) {
    interval.value = 300
  }
  emit('config-change', { interval: interval.value })
}

/**
 * 切换配置面板
 */
function toggleConfig() {
  showConfig.value = !showConfig.value
}

// 监听 Store 配置变化
watch(
  () => executionStore.scriptConfig.interval,
  (newInterval) => {
    interval.value = newInterval
  }
)
</script>

<template>
  <div class="script-controls">
    <!-- 状态显示 -->
    <div class="status-bar">
      <div class="status-indicator" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>

      <button class="config-toggle" @click="toggleConfig">
        <span class="config-icon">⚙️</span>
      </button>
    </div>

    <!-- 配置面板 -->
    <div v-if="showConfig" class="config-panel">
      <div class="config-item">
        <label class="config-label">执行间隔 (ms)</label>
        <div class="config-input-wrapper">
          <input
            v-model.number="interval"
            type="number"
            min="300"
            step="100"
            class="config-input"
            :disabled="isRunning"
            @change="handleIntervalChange"
          />
          <span class="config-hint">最小 300ms</span>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="control-buttons">
      <!-- 空闲状态：显示启动按钮 -->
      <template v-if="!isRunning && !isPaused">
        <button
          class="btn btn-primary btn-lg"
          :disabled="!canStart"
          @click="handleStart"
        >
          <span class="btn-icon">▶</span>
          启动脚本
        </button>
      </template>

      <!-- 运行中：显示暂停和停止按钮 -->
      <template v-else-if="isRunning">
        <button
          class="btn btn-warning"
          @click="handlePause"
        >
          <span class="btn-icon">⏸</span>
          暂停
        </button>
        <button
          class="btn btn-danger"
          @click="handleStop"
        >
          <span class="btn-icon">⏹</span>
          停止
        </button>
      </template>

      <!-- 暂停中：显示恢复和停止按钮 -->
      <template v-else-if="isPaused">
        <button
          class="btn btn-success"
          @click="handleResume"
        >
          <span class="btn-icon">▶</span>
          恢复
        </button>
        <button
          class="btn btn-danger"
          @click="handleStop"
        >
          <span class="btn-icon">⏹</span>
          停止
        </button>
      </template>
    </div>

    <!-- 未激活提示 -->
    <div v-if="!isSessionActive" class="inactive-hint">
      <span class="hint-icon">⚠️</span>
      <span class="hint-text">请先激活执行会话</span>
    </div>
  </div>
</template>

<style scoped>
.script-controls {
  padding: 16px;
  background-color: var(--bg-color-secondary, #f9fafb);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--text-color-secondary, #6b7280);
}

.status-indicator.running .status-dot {
  background-color: var(--success-color, #10b981);
  animation: pulse 1s infinite;
}

.status-indicator.paused .status-dot {
  background-color: var(--warning-color, #f59e0b);
}

.status-indicator.error .status-dot {
  background-color: var(--error-color, #ef4444);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
}

.config-toggle {
  padding: 8px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.config-toggle:hover {
  background-color: var(--bg-color-tertiary, #e5e7eb);
}

.config-icon {
  font-size: 18px;
}

.config-panel {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-primary, #1f2937);
}

.config-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-input {
  width: 120px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.config-input:focus {
  border-color: var(--primary-color, #3b82f6);
}

.config-input:disabled {
  background-color: var(--bg-color-secondary, #f3f4f6);
  cursor: not-allowed;
}

.config-hint {
  font-size: 12px;
  color: var(--text-color-secondary, #6b7280);
}

.control-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-lg {
  padding: 16px 24px;
  font-size: 16px;
}

.btn-icon {
  font-size: 14px;
}

.btn-primary {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-success {
  background-color: var(--success-color, #10b981);
  color: white;
}

.btn-warning {
  background-color: var(--warning-color, #f59e0b);
  color: white;
}

.btn-danger {
  background-color: var(--error-color, #ef4444);
  color: white;
}

.inactive-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
}

.hint-icon {
  font-size: 16px;
}

.hint-text {
  font-size: 13px;
  color: var(--warning-color, #f59e0b);
}
</style>
