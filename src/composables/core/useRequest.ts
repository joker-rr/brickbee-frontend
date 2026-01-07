import { ref, type Ref } from 'vue'

/**
 * 请求状态
 */
interface UseRequestOptions<T> {
  /** 初始数据 */
  initialData?: T
  /** 立即执行 */
  immediate?: boolean
  /** 错误处理 */
  onError?: (error: Error) => void
  /** 成功处理 */
  onSuccess?: (data: T) => void
}

/**
 * 请求 Composable
 */
export function useRequest<T = any>(
  requestFn: (...args: any[]) => Promise<T>,
  options: UseRequestOptions<T> = {}
) {
  const { initialData = null as T, immediate = false, onError, onSuccess } = options

  const data = ref<T>(initialData) as Ref<T>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 执行请求
   */
  const execute = async (...args: any[]) => {
    loading.value = true
    error.value = null

    try {
      const result = await requestFn(...args)
      data.value = result
      onSuccess?.(result)
      return result
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      onError?.(errorObj)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    data.value = initialData
    loading.value = false
    error.value = null
  }

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}
