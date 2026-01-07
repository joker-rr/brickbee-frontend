/**
 * ============================================================================
 * 文件名：useCountdown.ts
 * 位置：src/composables/useCountdown.ts
 * 作用：倒计时 Composable（可在 .ts 和 .vue 中使用）
 * ============================================================================
 */

import { ref, computed, onUnmounted } from 'vue'

export interface UseCountdownOptions {
  /**
   * 倒计时秒数
   */
  seconds: number
  /**
   * 是否自动开始
   */
  autoStart?: boolean
  /**
   * 倒计时结束回调
   */
  onFinish?: () => void
  /**
   * 倒计时更新回调
   */
  onUpdate?: (seconds: number) => void
  /**
   * 格式化函数
   */
  format?: (seconds: number) => string
}

/**
 * 倒计时 Composable
 *
 * @example
 * ```ts
 * const { displayText, start, stop, reset } = useCountdown({
 *   seconds: 60,
 *   autoStart: true,
 *   onFinish: () => logger.log('倒计时结束！')
 * })
 * ```
 */
export function useCountdown(options: UseCountdownOptions) {
  const {
    seconds,
    autoStart = false,
    onFinish,
    onUpdate,
    format = (s: number) => `${s}s`
  } = options

  // --------------------------------------------------------------------------
  // 状态
  // --------------------------------------------------------------------------

  const remainingSeconds = ref(seconds)
  const isRunning = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  // --------------------------------------------------------------------------
  // 计算属性
  // --------------------------------------------------------------------------

  /**
   * 显示文本
   */
  const displayText = computed(() => format(remainingSeconds.value))

  /**
   * 是否已结束
   */
  const isFinished = computed(() => remainingSeconds.value === 0)

  /**
   * 进度百分比 (0-100)
   */
  const progress = computed(() => {
    return Math.round(((seconds - remainingSeconds.value) / seconds) * 100)
  })

  // --------------------------------------------------------------------------
  // 方法
  // --------------------------------------------------------------------------

  /**
   * 开始倒计时
   */
  const start = () => {
    if (isRunning.value || remainingSeconds.value === 0) return

    isRunning.value = true
    timer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
        onUpdate?.(remainingSeconds.value)

        if (remainingSeconds.value === 0) {
          stop()
          onFinish?.()
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
    remainingSeconds.value = seconds
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

  // 自动开始
  if (autoStart) {
    start()
  }

  // 组件卸载时清理
  onUnmounted(() => {
    stop()
  })

  // --------------------------------------------------------------------------
  // 返回
  // --------------------------------------------------------------------------

  return {
    // 状态
    remainingSeconds,
    isRunning,
    isFinished,

    // 计算属性
    displayText,
    progress,

    // 方法
    start,
    stop,
    reset,
    restart
  }
}
