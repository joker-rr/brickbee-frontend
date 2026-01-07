/**
 * Market API 代理请求 Composable
 *
 * 通过服务器代理访问 Market API
 * 每次请求自动通过 executionSessionManager 获取 token
 *
 * @deprecated 高频自动化请求应使用 taskRunner
 * 此 composable 仅作为 Vue 组件的便捷封装
 */

import { ref, computed } from 'vue'
import { request } from '@/api/client'
import { executionSessionManager } from '@/composables/platform/platform-access'
import { PlatformType } from '@/config/platform.config'
import type {
  MarketProxyRequest,
  MarketProxyResponse,
  RequestStats
} from '@/types/market-automation'
import { logger } from '@/utils/logger'

/**
 * 代理 API 路由
 */
const PROXY_ROUTES = {
  MARKET: '/api/proxy/market'
} as const

/**
 * 请求统计初始值
 */
const INITIAL_STATS: RequestStats = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  avgResponseTime: 0,
  lastRequestAt: 0
}

/**
 * Market API 代理请求 Composable
 *
 * @deprecated 高频自动化请求应使用 taskRunner
 */
export function useMarketProxy(platform: PlatformType = PlatformType.MARKET) {
  /** 请求统计 */
  const stats = ref<RequestStats>({ ...INITIAL_STATS })

  /** 是否正在请求 */
  const isRequesting = ref(false)

  /** 最后错误 */
  const lastError = ref<string | null>(null)

  /** 响应时间列表（用于计算平均值） */
  const responseTimes = ref<number[]>([])

  /** 会话是否激活 */
  const isSessionActive = computed(() => executionSessionManager.isSessionValid(platform))

  /**
   * 发送 Market API 代理请求
   *
   * @deprecated 请通过 Adapter 调用，Adapter 会自动通过 executionSessionManager 获取 token
   */
  async function proxyRequest<T = unknown>(
    proxyRequest: MarketProxyRequest
  ): Promise<MarketProxyResponse<T>> {
    // 检查执行会话是否有效
    if (!executionSessionManager.isSessionValid(platform)) {
      const errorResponse: MarketProxyResponse<T> = {
        success: false,
        requestId: proxyRequest.requestId || generateRequestId(),
        error: '执行会话未激活，请先解锁 API Key',
        errorCode: 'EXECUTION_TOKEN_INVALID'
      }
      return errorResponse
    }

    isRequesting.value = true
    lastError.value = null

    const startTime = Date.now()
    const requestId = proxyRequest.requestId || generateRequestId()

    try {
      // 通过平台访问层获取有效 token（唯一入口）
      const token = await executionSessionManager.getValidToken(platform)

      // 发送代理请求
      const response = await request.post<MarketProxyResponse<T>>(
        PROXY_ROUTES.MARKET,
        {
          action: proxyRequest.action,
          params: proxyRequest.params,
          requestId
        },
        {
          headers: {
            'X-Execution-Token': token,
            'X-Request-Id': requestId
          }
        }
      )

      // 更新统计
      const duration = Date.now() - startTime
      updateStats(true, duration)
      executionSessionManager.recordRequest(platform, true, duration)

      // 解析限流信息（如果有）
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>
        if (data.rateLimitRemaining !== undefined) {
          stats.value.rateLimitStatus = {
            remaining: data.rateLimitRemaining as number,
            limit: data.rateLimitLimit as number,
            resetAt: data.rateLimitReset as number
          }
        }
      }

      return {
        ...response,
        requestId
      }
    } catch (err) {
      const duration = Date.now() - startTime
      updateStats(false, duration)
      executionSessionManager.recordRequest(platform, false, duration)

      const errorMessage = err instanceof Error ? err.message : '请求失败'
      lastError.value = errorMessage

      logger.error(`[MarketProxy] 请求失败 [${proxyRequest.action}]:`, err)

      return {
        success: false,
        requestId,
        error: errorMessage,
        errorCode: 'NETWORK_ERROR'
      }
    } finally {
      isRequesting.value = false
    }
  }

  /**
   * 便捷方法：获取库存
   */
  async function getInventory(params?: Record<string, unknown>) {
    return proxyRequest({
      action: 'getInventory',
      params
    })
  }

  /**
   * 便捷方法：获取在售物品
   */
  async function getSelling(params?: Record<string, unknown>) {
    return proxyRequest({
      action: 'getSelling',
      params
    })
  }

  /**
   * 便捷方法：获取最低价格
   */
  async function getMinPrices(hashNames: string[]) {
    return proxyRequest({
      action: 'getMinPrices',
      params: { hashNames }
    })
  }

  /**
   * 便捷方法：设置价格
   */
  async function setPrice(itemId: string, price: number) {
    return proxyRequest({
      action: 'setPrice',
      params: { itemId, price }
    })
  }

  /**
   * 便捷方法：下架物品
   */
  async function removeItem(itemId: string) {
    return proxyRequest({
      action: 'removeItem',
      params: { itemId }
    })
  }

  /**
   * 便捷方法：获取余额
   */
  async function getBalance() {
    return proxyRequest({
      action: 'getBalance'
    })
  }

  /**
   * 便捷方法：获取物品详情
   */
  async function getItemInfo(classId: string, instanceId: string) {
    return proxyRequest({
      action: 'getItemInfo',
      params: { classId, instanceId }
    })
  }

  /**
   * 更新请求统计
   */
  function updateStats(success: boolean, duration: number): void {
    stats.value.totalRequests++
    stats.value.lastRequestAt = Date.now()

    if (success) {
      stats.value.successRequests++
    } else {
      stats.value.failedRequests++
    }

    // 更新平均响应时间（保留最近 100 次）
    responseTimes.value.push(duration)
    if (responseTimes.value.length > 100) {
      responseTimes.value.shift()
    }

    stats.value.avgResponseTime = Math.round(
      responseTimes.value.reduce((a, b) => a + b, 0) / responseTimes.value.length
    )
  }

  /**
   * 重置统计
   */
  function resetStats(): void {
    stats.value = { ...INITIAL_STATS }
    responseTimes.value = []
    lastError.value = null
  }

  /**
   * 生成请求 ID
   */
  function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    // 状态
    stats: computed(() => stats.value),
    isRequesting: computed(() => isRequesting.value),
    lastError: computed(() => lastError.value),
    isSessionActive,

    // 通用请求方法
    request: proxyRequest,

    // 便捷方法
    getInventory,
    getSelling,
    getMinPrices,
    setPrice,
    removeItem,
    getBalance,
    getItemInfo,

    // 工具方法
    resetStats
  }
}