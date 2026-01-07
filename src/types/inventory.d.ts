/**
 * 库存模块类型定义
 *
 * 包含库存物品、分组、展示模式等类型
 */

import type { PlatformType } from '@/config/platform.config'

/**
 * 物品基础接口
 */
export interface BaseItem {
  /** 唯一标识 */
  id: string
  /** Steam资产ID */
  assetId: string
  /** 类别ID */
  classId: string
  /** 实例ID */
  instanceId: string
  /** 市场哈希名称 */
  marketHashName: string
  /** 显示名称 */
  name: string
  /** 物品类型 */
  type: string
  /** 图片URL */
  imageUrl: string
  /** 边框颜色 */
  color?: string
  /** 是否可交易 */
  tradable: boolean
  /** 是否可上架 */
  marketable: boolean
  /** 冷却时间 */
  cooldown?: string
  /** 名称标签 */
  nameTag?: string
}

/**
 * 物品稀有度接口
 */
export interface ItemRarity {
  /** 稀有度英文名 */
  rarity: string
  /** 稀有度中文名 */
  rarityZh: string
}

/**
 * 物品 SEO 信息接口
 */
export interface ItemSeo {
  /** 类别中文名 */
  seoCategoryZh: string
  /** 外观中文名 */
  exteriorZh?: string
}

/**
 * 贴纸接口
 */
export interface ItemSticker {
  /** 贴纸名称 */
  name: string
  /** 贴纸图片 */
  image: string
  /** 磨损度 */
  wear?: number
}

/**
 * 物品详情接口
 */
export interface ItemDetail {
  /** 图片URL */
  image: string
  /** 市场名称 */
  marketName: string
  /** 稀有度 */
  rarity: ItemRarity
  /** 外观 */
  exterior?: string
  /** SEO信息 */
  seo: ItemSeo
  /** 贴纸列表 */
  stickers?: ItemSticker[]
}

/**
 * 库存物品接口
 */
export interface InventoryItem extends BaseItem {
  /** 平台价格 */
  marketPrice?: number
  /** 成本价 */
  costPrice?: number
  /** 物品详情 */
  detail?: ItemDetail
  /** 加载状态 */
  loading?: boolean
  /** 错误信息 */
  error?: string
  /** 是否选中 */
  selected?: boolean
  /** 是否显示在统计中 */
  showValue?: boolean
  /** 平台特定数据 */
  platformData?: Record<string, unknown>
}

/**
 * 分组物品接口
 * 按照 marketHashName 分组
 */
export interface GroupedItems {
  [marketHashName: string]: InventoryItem[]
}

/**
 * 展示模式类型
 */
export type DisplayMode = 'expanded' | 'grouped'

/**
 * 物品统计接口
 */
export interface ItemStats {
  /** 总数量 */
  totalCount: number
  /** 总价值 */
  totalValue: number
  /** 总成本 */
  totalCost: number
  /** 总利润 */
  totalProfit: number
  /** 可交易数量 */
  tradableCount: number
  /** 平均成本 */
  averageCost: number
}

/**
 * 分组统计接口
 */
export interface GroupStats {
  /** 平均成本价 */
  averageCost: number | null
  /** 有成本价的物品数量 */
  count: number
  /** 是否有有效价格 */
  hasValidPrices: boolean
}

/**
 * 价格信息接口（平台差异化）
 */
export interface PriceInfo {
  /** 原始价格 */
  rawPrice: number
  /** 货币类型 */
  currency: 'CNY' | 'USD'
  /** 平台费率 */
  platformFee: number
  /** 汇率（仅MARKET） */
  exchangeRate?: number
}

/**
 * 利润计算配置接口
 */
export interface ProfitConfig {
  /** 平台类型 */
  platform: PlatformType
  /** 汇率（仅MARKET需要） */
  exchangeRate?: number
  /** 平台费率 */
  platformFee: number
  /** 额外费率 */
  additionalFee?: number
}

/**
 * 成本价存储格式
 */
export interface CostPriceRecord {
  /** 平台类型 */
  platform: PlatformType
  /** 物品ID到成本价的映射 */
  prices: Record<string, number>
  /** 更新时间 */
  updatedAt: string
}

/**
 * 筛选条件接口
 */
export interface InventoryFilter {
  /** 搜索关键词 */
  search?: string
  /** 是否只显示可交易物品 */
  tradableOnly?: boolean
  /** 稀有度筛选 */
  rarity?: string[]
  /** 类型筛选 */
  type?: string[]
  /** 价格范围 */
  priceRange?: {
    min?: number
    max?: number
  }
}

/**
 * 排序配置接口
 */
export interface InventorySort {
  /** 排序字段 */
  field: 'name' | 'price' | 'costPrice' | 'profit' | 'time'
  /** 排序方向 */
  order: 'asc' | 'desc'
}
