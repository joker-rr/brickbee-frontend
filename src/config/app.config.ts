import { env } from './env.config'

/**
 * 应用配置
 */
export const appConfig = {
  /** 应用标题 */
  title: env.VITE_APP_TITLE,

  /** 是否启用 Mock */
  enableMock: env.VITE_ENABLE_MOCK,

  /** 是否启用开发者工具 */
  enableDevtools: env.VITE_ENABLE_DEVTOOLS,

  /** 分页配置 */
  pagination: {
    /** 默认每页显示数量 */
    defaultPageSize: 20,
    /** 可选的每页显示数量 */
    pageSizes: [10, 20, 50, 100]
  },

  /** 缓存配置 */
  cache: {
    /** 库存缓存时间（毫秒）- 15分钟 */
    inventoryTTL: 15 * 60 * 1000,
    /** 物品详情缓存时间（毫秒）- 7天 */
    itemDetailTTL: 7 * 24 * 60 * 60 * 1000,
    /** 最大缓存数量 */
    maxCacheSize: 100
  }
}
