/**
 * 数据标准化 Composable
 *
 * 将 API 返回的原始数据转换为标准格式
 * 从 adapter 中迁移 normalize 逻辑
 */

import { PlatformType } from '@/config/platform.config'
import type {
  InventoryItem,
  ItemDetail,
  GroupedItems,
  ItemRarity,
  ItemSeo,
  ItemSticker
} from '@/types/inventory'
import type { SellingItem, SellHistoryItem } from '@/types/selling'

// ============================================================================
// 标准化函数
// ============================================================================

/**
 * 标准化库存物品
 *
 * 将 API 返回的原始数据转换为 InventoryItem 格式
 */
export function normalizeInventoryItem(
  raw: Record<string, unknown>,
  platform?: PlatformType
): InventoryItem {
  return {
    id: String(raw.id || raw.asset || ''),
    assetId: String(raw.assetid || raw.asset_id || raw.assetId || raw.asset || ''),
    classId: String(raw.classid || raw.class_id || raw.classId || ''),
    instanceId: String(raw.instanceid || raw.instance_id || raw.instanceId || '0'),
    marketHashName: String(raw.market_hash_name || raw.marketHashName || raw.hashName || ''),
    name: String(raw.name || raw.market_hash_name || ''),
    type: String(raw.type || raw.item_type || ''),
    imageUrl: String(raw.image_url || raw.imageUrl || raw.icon_url || ''),
    color: raw.color ? String(raw.color) : undefined,
    tradable: Boolean(raw.tradable),
    marketable: Boolean(raw.marketable),
    marketPrice: typeof raw.market_price === 'number'
      ? raw.market_price
      : typeof raw.marketPrice === 'number'
        ? raw.marketPrice
        : typeof raw.price === 'number'
          ? raw.price
          : undefined,
    costPrice: typeof raw.costPrice === 'number' ? raw.costPrice : undefined,
    loading: false,
    selected: false,
    showValue: false,
    platformData: platform
      ? {
          platform,
          currency: platform === PlatformType.MARKET ? 'USD' : 'CNY',
          originalPrice: raw.price,
          originalData: raw
        }
      : {}
  }
}

/**
 * 批量标准化库存物品
 */
export function normalizeInventoryItems(
  rawItems: Record<string, unknown>[],
  platform?: PlatformType
): InventoryItem[] {
  return rawItems.map((item) => normalizeInventoryItem(item, platform))
}

/**
 * 标准化物品详情
 */
export function normalizeItemDetail(raw: Record<string, unknown>): ItemDetail {
  const rarity = raw.rarity as Record<string, unknown> | undefined
  const seo = raw.seo as Record<string, unknown> | undefined
  const stickers = raw.stickers as Array<Record<string, unknown>> | undefined

  return {
    image: String(raw.image || ''),
    marketName: String(raw.market_name || raw.marketName || ''),
    rarity: {
      rarity: String(rarity?.rarity || ''),
      rarityZh: String(rarity?.rarity_zh || rarity?.rarityZh || '')
    } as ItemRarity,
    exterior: raw.exterior ? String(raw.exterior) : undefined,
    seo: {
      seoCategoryZh: String(seo?.seo_category_zh || seo?.seoCategoryZh || ''),
      exteriorZh: seo?.exterior_zh ? String(seo.exterior_zh) : undefined
    } as ItemSeo,
    stickers:
      stickers?.map(
        (s) =>
          ({
            name: String(s.name || ''),
            image: String(s.image || ''),
            wear: typeof s.wear === 'number' ? s.wear : undefined
          }) as ItemSticker
      ) || []
  }
}

/**
 * 标准化在售物品
 */
export function normalizeSellingItem(
  raw: Record<string, unknown>,
  platform?: PlatformType
): SellingItem {
  const baseItem = normalizeInventoryItem(raw, platform)

  return {
    ...baseItem,
    listPrice: typeof raw.listPrice === 'number' ? raw.listPrice : 0,
    listedAt: String(raw.listedAt || raw.listed_at || ''),
    status: (raw.status as 'active' | 'pending' | 'sold') || 'active'
  }
}

/**
 * 批量标准化在售物品
 */
export function normalizeSellingItems(
  rawItems: Record<string, unknown>[],
  platform?: PlatformType
): SellingItem[] {
  return rawItems.map((item) => normalizeSellingItem(item, platform))
}

/**
 * 标准化销售历史
 */
export function normalizeSellHistoryItem(raw: Record<string, unknown>): SellHistoryItem {
  const sellPrice = typeof raw.sellPrice === 'number' ? raw.sellPrice : 0
  const costPrice = typeof raw.costPrice === 'number' ? raw.costPrice : undefined
  const profit = costPrice !== undefined ? sellPrice - costPrice : undefined
  const profitRate = costPrice && costPrice > 0 ? ((profit || 0) / costPrice) * 100 : undefined

  return {
    id: String(raw.id || ''),
    assetId: String(raw.assetId || raw.asset_id || ''),
    marketHashName: String(raw.marketHashName || raw.market_hash_name || ''),
    name: String(raw.name || ''),
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
    sellPrice,
    costPrice,
    profit,
    profitRate,
    soldAt: String(raw.soldAt || raw.sold_at || ''),
    buyerName: raw.buyerName ? String(raw.buyerName) : undefined
  }
}

/**
 * 批量标准化销售历史
 */
export function normalizeSellHistoryItems(rawItems: Record<string, unknown>[]): SellHistoryItem[] {
  return rawItems.map((item) => normalizeSellHistoryItem(item))
}

// ============================================================================
// 分组函数
// ============================================================================

/**
 * 按市场哈希名分组
 */
export function groupByMarketHashName(items: InventoryItem[]): GroupedItems {
  const grouped: GroupedItems = {}

  for (const item of items) {
    const name = item.marketHashName
    if (!grouped[name]) {
      grouped[name] = []
    }
    grouped[name].push(item)
  }

  return grouped
}

/**
 * 获取分组数量
 */
export function getGroupCount(groupedItems: GroupedItems, marketHashName: string): number {
  return groupedItems[marketHashName]?.length || 0
}

/**
 * 获取分组物品
 */
export function getGroupItems(groupedItems: GroupedItems, marketHashName: string): InventoryItem[] {
  return groupedItems[marketHashName] || []
}

// ============================================================================
// Composable
// ============================================================================

/**
 * 数据标准化 Composable
 *
 * 提供数据标准化和分组方法
 */
export function useDataNormalizer(platform?: () => PlatformType) {
  const getPlatform = (): PlatformType | undefined => {
    return platform?.()
  }

  return {
    // 标准化方法
    normalizeInventoryItem: (raw: Record<string, unknown>) =>
      normalizeInventoryItem(raw, getPlatform()),
    normalizeInventoryItems: (rawItems: Record<string, unknown>[]) =>
      normalizeInventoryItems(rawItems, getPlatform()),
    normalizeItemDetail,
    normalizeSellingItem: (raw: Record<string, unknown>) =>
      normalizeSellingItem(raw, getPlatform()),
    normalizeSellingItems: (rawItems: Record<string, unknown>[]) =>
      normalizeSellingItems(rawItems, getPlatform()),
    normalizeSellHistoryItem,
    normalizeSellHistoryItems,

    // 分组方法
    groupByMarketHashName,
    getGroupCount,
    getGroupItems
  }
}

// ============================================================================
// 类型导出
// ============================================================================

export type UseDataNormalizerReturn = ReturnType<typeof useDataNormalizer>
