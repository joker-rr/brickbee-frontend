/**
 * 物品卡片公共类型定义
 *
 * 注意：这些类型设计为兼容多种数据格式
 */

/** 贴纸信息 */
export interface StickerInfo {
  name: string
  image: string
  wear?: number
}

/** 物品稀有度（兼容多种格式） */
export interface ItemRarityInfo {
  rarity?: string
  rarity_zh?: string
  rarity_name?: string
  rarityZh?: string
}

/** 物品 SEO 信息（兼容多种格式） */
export interface ItemSeoInfo {
  seo_category_zh?: string
  seo_category?: string
  seoCategoryZh?: string
  exterior_zh?: string
  exteriorZh?: string
}

/** 物品详情（兼容多种格式） */
export interface ItemDetailInfo {
  image?: string
  market_name?: string
  marketName?: string
  rarity?: ItemRarityInfo | string
  seo?: ItemSeoInfo
  exterior?: string
  exterior_zh?: string
  nameTag?: string
  stickers?: StickerInfo[]
}

/** 统一的物品类型（兼容 InventoryItem 和其他格式） */
export interface BaseItem {
  id: string
  assetId?: string
  assetid?: string
  classId?: string
  instanceId?: string
  name?: string
  marketHashName?: string
  market_hash_name?: string
  imageUrl?: string
  image?: string
  detail?: ItemDetailInfo | string | unknown
  color?: string
  type?: string

  // 价格相关
  marketPrice?: number
  market_price?: number
  listPrice?: number
  price?: number
  costPrice?: number | string

  // 状态相关
  status?: string | number
  tradable?: boolean
  marketable?: boolean
  cooldown?: string
  loading?: boolean
  error?: string
  selected?: boolean
  showValue?: boolean

  // 平台相关
  usdCny?: number
  platformData?: Record<string, unknown>

  // 名称标签
  nameTag?: string
}

/** 物品卡片显示模式 */
export type DisplayMode = 'expanded' | 'grouped'

/** 物品状态类型 */
export type ItemStatus = 'active' | 'pending' | 'sold' | 'tradable' | 'non_tradable' | number

/** 平台类型 */
export type PlatformType = 'CSGOBUY' | 'MARKET' | string