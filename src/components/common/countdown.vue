<!--
 * @Author: joker.rrr
 * @Date: 2025-12-13 17:01:31
 * @LastEditors: joker.rrr
 * @LastEditTime: 2025-12-13 19:15:42
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\components\common\countdown.vue
 * @Description: 倒计时组件
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

// --------------------------------------------------------------------------
// Props 定义
// --------------------------------------------------------------------------

interface Props {
  /**
   * 倒计时秒数
   */
  seconds: number
  /**
   * 是否自动开始
   */
  autoStart?: boolean
  /**
   * 格式化函数（可选）
   */
  format?: (seconds: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true,
  format: (seconds: number) => `${seconds}s`
})

// --------------------------------------------------------------------------
// Emits 定义
// --------------------------------------------------------------------------

interface Emits {
  /**
   * 倒计时结束事件
   */
  (e: 'finish'): void
  /**
   * 倒计时更新事件
   */
  (e: 'update', seconds: number): void
}

const emit = defineEmits<Emits>()

// --------------------------------------------------------------------------
// 状态
// --------------------------------------------------------------------------

const remainingSeconds = ref(props.seconds)
const isRunning = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

// --------------------------------------------------------------------------
// 计算属性
// --------------------------------------------------------------------------

const displayText = ref('')

// --------------------------------------------------------------------------
// 方法
// --------------------------------------------------------------------------

/**
 * 更新显示文本
 */
const updateDisplayText = () => {
  if (props.format) {
    displayText.value = props.format(remainingSeconds.value)
  } else {
    displayText.value = `${remainingSeconds.value}s`
  }
}

/**
 * 开始倒计时
 */
const start = () => {
  if (isRunning.value) return

  isRunning.value = true
  timer = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
      updateDisplayText()
      emit('update', remainingSeconds.value)

      if (remainingSeconds.value === 0) {
        stop()
        emit('finish')
      }
    }
  }, 1000)
}

/**
 * 停止倒计时
 */
const stop = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isRunning.value = false
}

/**
 * 重置倒计时
 */
const reset = () => {
  stop()
  remainingSeconds.value = props.seconds
  updateDisplayText()
}

/**
 * 重启倒计时
 */
const restart = () => {
  reset()
  start()
}

// --------------------------------------------------------------------------
// 生命周期
// --------------------------------------------------------------------------

onMounted(() => {
  updateDisplayText()
  if (props.autoStart) {
    start()
  }
})

onUnmounted(() => {
  stop()
})

// 监听 props.seconds 变化
watch(() => props.seconds, (newSeconds) => {
  remainingSeconds.value = newSeconds
  updateDisplayText()
})

// --------------------------------------------------------------------------
// 暴露方法给父组件
// --------------------------------------------------------------------------

defineExpose({
  start,
  stop,
  reset,
  restart,
  remainingSeconds
})
</script>

<template>
  <span class="countdown">{{ displayText }}</span>
</template>

<style lang="scss" scoped>
.countdown {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}
</style>
