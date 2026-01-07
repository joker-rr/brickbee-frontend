/**
 * ============================================================================
 * 文件名：toast.ts
 * 位置：src/utils/toast.ts
 * 作用：全局消息提示系统（原生实现，不依赖第三方库）
 * 为什么需要：
 *   1. 统一的消息提示入口
 *   2. 自动管理消息队列和显示时长
 *   3. 支持多种类型（success, error, warning, info）
 * ============================================================================
 */

import { createApp, h, ref, Transition } from 'vue'

/**
 * Toast 类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast 配置选项
 */
export interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number // 显示时长（毫秒），0 表示不自动关闭
  onClose?: () => void
}

/**
 * Toast 实例接口
 */
interface ToastInstance {
  id: number
  message: string
  type: ToastType
  visible: boolean
  close: () => void
  pause: () => void
  resume: () => void
}

// 全局 Toast 实例列表
const toastInstances = ref<ToastInstance[]>([])
let toastIdCounter = 0

/**
 * Toast 组件
 */
const ToastComponent = {
  name: 'Toast',
  props: {
    instances: {
      type: Array as () => ToastInstance[],
      required: true,
    },
  },
  setup(props: any) {
    return () =>
      h(
        'div',
        {
          class: 'toast-container',
          style: {
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          },
        },
        (props.instances as ToastInstance[]).map((instance) =>
          h(
            Transition,
            {
              name: 'toast-fade',
              appear: true,
              key: instance.id,
            },
            () =>
              instance.visible
                ? h(
                  'div',
                  {
                    class: ['toast-item', `toast-${instance.type}`],
                    style: {
                      pointerEvents: 'auto',
                      padding: '12px 20px',
                      backgroundColor: getBackgroundColor(instance.type),
                      color: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      minWidth: '300px',
                      maxWidth: '500px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    },
                    onClick: instance.close,
                    onMouseenter: instance.pause,
                    onMouseleave: instance.resume,
                  },
                  [
                    // 图标
                    h('span', { class: 'toast-icon' }, getIcon(instance.type)),
                    // 消息内容
                    h('span', { class: 'toast-message' }, instance.message),
                    // 关闭按钮
                    h(
                      'span',
                      {
                        class: 'toast-close',
                        style: {
                          marginLeft: 'auto',
                          cursor: 'pointer',
                          opacity: 0.8,
                          fontSize: '18px',
                          lineHeight: 1,
                        },
                      },
                      '×'
                    ),
                  ]
                )
                : null
          )
        )
      )
  },
}

/**
 * 获取背景颜色
 */
function getBackgroundColor(type: ToastType): string {
  const colors: Record<ToastType, string> = {
    success: '#52c41a',
    error: '#f5222d',
    warning: '#faad14',
    info: '#1890ff',
  }
  return colors[type] || colors.info
}

/**
 * 获取图标
 */
function getIcon(type: ToastType): string {
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }
  return icons[type] || icons.info
}

// Toast 容器的应用实例
let toastApp: ReturnType<typeof createApp> | null = null
let toastContainer: HTMLDivElement | null = null

/**
 * 初始化 Toast 容器
 */
function initToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-root'
    document.body.appendChild(toastContainer)

    toastApp = createApp(ToastComponent, {
      instances: toastInstances.value,
    })
    toastApp.mount(toastContainer)

    // 添加 CSS 动画
    const style = document.createElement('style')
    style.textContent = `
      .toast-fade-enter-active,
      .toast-fade-leave-active {
        transition: all 0.3s ease;
      }
      .toast-fade-enter-from {
        opacity: 0;
        transform: translateY(-20px);
      }
      .toast-fade-leave-to {
        opacity: 0;
        transform: translateY(-20px);
      }
    `
    document.head.appendChild(style)
  }
}

/**
 * 显示 Toast 消息
 */
function showToast(options: ToastOptions): () => void {
  initToastContainer()

  const id = toastIdCounter++
  const duration = options.duration ?? 3000

  let timer: ReturnType<typeof setTimeout> | null = null
  let remainingTime = duration
  let startTime = Date.now()

  const instance: ToastInstance = {
    id,
    message: options.message,
    type: options.type || 'info',
    visible: true,
    close: () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      instance.visible = false
      setTimeout(() => {
        const index = toastInstances.value.findIndex((item) => item.id === id)
        if (index > -1) {
          toastInstances.value.splice(index, 1)
        }
        options.onClose?.()
      }, 300) // 等待动画结束
    },
    pause: () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
        // 计算剩余时间
        remainingTime = remainingTime - (Date.now() - startTime)
      }
    },
    resume: () => {
      if (remainingTime > 0 && !timer) {
        startTime = Date.now()
        timer = setTimeout(() => {
          instance.close()
        }, remainingTime)
      }
    },
  }

  toastInstances.value.push(instance)

  // 自动关闭
  if (duration > 0) {
    timer = setTimeout(() => {
      instance.close()
    }, duration)
  }

  return instance.close
}

/**
 * Toast 工具对象
 */
export const toast = {
  /**
   * 成功提示
   */
  success(message: string, duration?: number) {
    return showToast({ message, type: 'success', duration })
  },

  /**
   * 错误提示
   */
  error(message: string, duration?: number) {
    return showToast({ message, type: 'error', duration: duration ?? 4000 })
  },

  /**
   * 警告提示
   */
  warning(message: string, duration?: number) {
    return showToast({ message, type: 'warning', duration })
  },

  /**
   * 信息提示
   */
  info(message: string, duration?: number) {
    return showToast({ message, type: 'info', duration })
  },

  /**
   * 自定义 Toast
   */
  show(options: ToastOptions) {
    return showToast(options)
  },
}
