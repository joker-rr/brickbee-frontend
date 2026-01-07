# CS 饰品交易管理平台 - 库存/在售模块重构架构文档

> 版本: 1.0.0
> 更新日期: 2024-12-24
> 作者: AI Architecture Assistant

---

## 一、目录结构设计

### 1.1 新增/修改的文件清单

```
brickbee-frontend-ts/src/
├── api/
│   └── modules/
│       └── platform/
│           └── adapters/
│               ├── base.adapter.ts          # [已有] 适配器基类
│               ├── csgobuy.adapter.ts       # [扩展] CSGOBUY适配器
│               ├── market.adapter.ts        # [扩展] MARKET适配器
│               ├── buff.adapter.ts          # [扩展] BUFF适配器
│               ├── index.ts                 # [已有] 适配器导出
│               └── types/
│                   ├── inventory.types.ts   # [新增] 库存相关类型
│                   ├── selling.types.ts     # [新增] 在售相关类型
│                   └── common.types.ts      # [新增] 公共类型定义
│
├── composables/
│   └── business/
│       ├── useInventory.ts                  # [扩展] 库存数据管理
│       ├── useSelling.ts                    # [新增] 在售数据管理
│       ├── useItemDisplay.ts                # [新增] 物品展示模式管理
│       ├── useBatchOperation.ts             # [新增] 批量操作
│       ├── useSmartLoading.ts               # [新增] 智能加载管理
│       ├── usePlatformAdapter.ts            # [新增] 平台适配器选择
│       └── useCostPrice.ts                  # [新增] 成本价管理
│
├── stores/
│   └── modules/
│       ├── platform.ts                      # [已有] 平台Store
│       ├── inventory.ts                     # [新增] 库存Store
│       └── selling.ts                       # [新增] 在售Store
│
├── utils/
│   └── cache/
│       ├── cache-manager.ts                 # [已有] LRU缓存管理器
│       ├── storage-cache.ts                 # [新增] localStorage缓存封装
│       └── hybrid-cache.ts                  # [新增] 混合缓存策略
│
├── components/
│   └── inventory/
│       ├── InventoryContainer.vue           # [新增] 库存容器组件
│       ├── InventoryToolbar.vue             # [新增] 工具栏组件
│       ├── InventoryGrid.vue                # [新增] 网格布局组件
│       ├── ItemCard.vue                     # [新增] 物品卡片组件
│       ├── ItemCardGroup.vue                # [新增] 组合模式卡片组件
│       ├── BatchActions.vue                 # [新增] 批量操作组件
│       ├── CostPriceInput.vue               # [新增] 成本价输入组件
│       ├── ItemStickers.vue                 # [新增] 贴纸展示组件
│       └── VirtualScroller.vue              # [新增] 虚拟滚动组件
│
├── views/
│   └── platform-center/
│       └── components/
│           ├── InventoryTab.vue             # [扩展] 库存Tab组件
│           └── SellingTab.vue               # [扩展] 在售Tab组件
│
└── types/
    ├── inventory.d.ts                       # [新增] 库存类型声明
    ├── selling.d.ts                         # [新增] 在售类型声明
    └── platform.d.ts                        # [扩展] 平台类型声明
```

---

## 二、核心接口定义

### 2.1 物品基础类型

```typescript
// src/types/inventory.d.ts

/**
 * 平台类型枚举
 */
export enum PlatformType {
  MARKET = 'MARKET',
  CSGOBUY = 'CSGOBUY',
  BUFF = 'BUFF'
}

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
 * 物品详情接口
 */
export interface ItemDetail {
  /** 图片URL */
  image: string
  /** 市场名称 */
  marketName: string
  /** 稀有度 */
  rarity: {
    rarity: string
    rarityZh: string
  }
  /** 外观 */
  exterior?: string
  /** SEO信息 */
  seo: {
    seoCategoryZh: string
    exteriorZh?: string
  }
  /** 贴纸列表 */
  stickers?: ItemSticker[]
}

/**
 * 贴纸接口
 */
export interface ItemSticker {
  name: string
  image: string
  wear?: number
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
 * 在售物品接口
 */
export interface SellingItem extends InventoryItem {
  /** 上架价格 */
  listPrice: number
  /** 上架时间 */
  listedAt: string
  /** 状态 */
  status: 'active' | 'pending' | 'sold'
  /** 订单ID */
  orderId?: string
}

/**
 * 分组物品接口
 */
export interface GroupedItems {
  [marketHashName: string]: InventoryItem[]
}

/**
 * 展示模式
 */
export type DisplayMode = 'expanded' | 'grouped'

/**
 * 物品统计
 */
export interface ItemStats {
  totalCount: number
  totalValue: number
  totalCost: number
  totalProfit: number
  tradableCount: number
  averageCost: number
}
```

### 2.2 适配器接口扩展

```typescript
// src/api/modules/platform/adapters/types/inventory.types.ts

import type { PlatformType, InventoryItem, SellingItem, ItemDetail } from '@/types/inventory'

/**
 * 获取库存参数
 */
export interface GetInventoryParams {
  page?: number
  pageSize?: number
  search?: string
  tradableOnly?: boolean
  sortBy?: 'name' | 'price' | 'time'
  sortOrder?: 'asc' | 'desc'
  signal?: AbortSignal
}

/**
 * 库存响应接口
 */
export interface InventoryResponse {
  success: boolean
  items: InventoryItem[]
  total: number
  /** 原始物品数据（用于后续详情加载） */
  rawItems?: InventoryItem[]
  /** 分组数据 */
  groupedItems?: GroupedItems
}

/**
 * 物品详情请求参数
 */
export interface GetItemDetailParams {
  classId: string
  instanceId: string
  signal?: AbortSignal
}

/**
 * 物品详情响应
 */
export interface ItemDetailResponse {
  success: boolean
  data: ItemDetail
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
 * 平台适配器扩展接口
 */
export interface IPlatformInventoryAdapter {
  readonly platformType: PlatformType
  readonly platformName: string

  /** 是否支持汇率 */
  readonly supportsExchangeRate: boolean

  /** 获取库存 */
  getInventory(params?: GetInventoryParams): Promise<InventoryResponse>

  /** 获取物品详情 */
  getItemDetail(params: GetItemDetailParams): Promise<ItemDetailResponse>

  /** 计算利润 */
  calculateProfit(item: InventoryItem, exchangeRate?: number): number

  /** 标准化价格 */
  normalizePrice(priceInfo: PriceInfo): number

  /** 批量上架 */
  batchList(items: InventoryItem[], price: number): Promise<{ success: boolean; results: any[] }>

  /** 批量下架 */
  batchDelist(items: SellingItem[]): Promise<{ success: boolean; results: any[] }>
}
```

### 2.3 缓存接口

```typescript
// src/utils/cache/hybrid-cache.ts

export interface HybridCacheOptions {
  /** 运行时缓存TTL（毫秒） */
  runtimeTTL: number
  /** 持久化缓存TTL（毫秒），默认10分钟 */
  storageTTL?: number
  /** 最大缓存数量 */
  maxSize?: number
  /** 缓存键前缀 */
  prefix?: string
  /** 是否启用跨标签页同步 */
  syncAcrossTabs?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  version?: string
}

export interface HybridCache<T> {
  /** 获取缓存 */
  get(key: string): T | null

  /** 设置缓存 */
  set(key: string, data: T): void

  /** 检查是否存在有效缓存 */
  has(key: string): boolean

  /** 删除缓存 */
  delete(key: string): void

  /** 清空所有缓存 */
  clear(): void

  /** 获取或设置缓存 */
  getOrSet(key: string, fetcher: () => Promise<T>): Promise<T>

  /** 强制刷新 */
  refresh(key: string, fetcher: () => Promise<T>): Promise<T>

  /** 获取缓存统计 */
  getStats(): CacheStats
}
```

---

## 三、数据流图

### 3.1 整体数据流架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户界面层 (Views)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PlatformCenter.vue                                                  │   │
│  │    ├── InventoryTab.vue                                              │   │
│  │    │     └── InventoryContainer.vue                                  │   │
│  │    │           ├── InventoryToolbar.vue                              │   │
│  │    │           ├── InventoryGrid.vue / VirtualScroller.vue           │   │
│  │    │           │     └── ItemCard.vue / ItemCardGroup.vue            │   │
│  │    │           └── BatchActions.vue                                  │   │
│  │    └── SellingTab.vue                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Composables层 (业务逻辑)                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ useInventory │ │  useSelling  │ │useItemDisplay│ │useBatchOp    │       │
│  │  - items     │ │  - items     │ │ - mode       │ │ - selected   │       │
│  │  - loading   │ │  - loading   │ │ - grouped    │ │ - operations │       │
│  │  - fetch()   │ │  - fetch()   │ │ - toggle()   │ │ - execute()  │       │
│  └──────┬───────┘ └──────┬───────┘ └──────────────┘ └──────────────┘       │
│         │                │                                                  │
│  ┌──────┴────────────────┴──────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    usePlatformAdapter        │  │useSmartLoading│  │ useCostPrice │      │
│  │  - getAdapter(platform)      │  │ - manager     │  │ - setPrice() │      │
│  │  - calculateProfit()         │  │ - register()  │  │ - getAvg()   │      │
│  └──────────────┬───────────────┘  └──────┬───────┘  └──────────────┘      │
└─────────────────┼──────────────────────────┼────────────────────────────────┘
                  │                          │
                  ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Store层 (Pinia)                                 │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  platformStore                                                      │     │
│  │    ├── currentPlatform: PlatformType                               │     │
│  │    ├── inventoryData: Map<Platform, InventoryItem[]>               │     │
│  │    ├── sellingData: Map<Platform, SellingItem[]>                   │     │
│  │    └── costPriceMap: Map<Platform, Map<itemId, price>>             │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  inventoryStore                                                     │     │
│  │    ├── displayMode: 'expanded' | 'grouped'                         │     │
│  │    ├── selectedItems: Set<string>                                  │     │
│  │    └── loadingStates: Map<string, boolean>                         │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              缓存层 (Hybrid Cache)                           │
│  ┌─────────────────────────┐     ┌──────────────────────────┐              │
│  │   CacheManager (LRU)    │◄───►│   StorageCache           │              │
│  │   - 运行时内存缓存       │     │   - localStorage持久化   │              │
│  │   - 快速访问            │     │   - 10分钟过期           │              │
│  │   - BroadcastChannel    │     │   - 跨会话保留           │              │
│  └─────────────────────────┘     └──────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API层 (Platform Adapters)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │MARKETAdapter │  │CSGOBUYAdapter│  │ BUFFAdapter  │                       │
│  │ + 汇率支持    │  │ - 无汇率     │  │ - 待实现    │                       │
│  │ + USD计价    │  │ + CNY计价    │  │             │                       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘                       │
│         └──────────────────┼──────────────────┘                             │
│                            ▼                                                │
│                    BasePlatformAdapter                                      │
│                    - normalizeItem()                                        │
│                    - normalizePrice()                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │   后端 API 服务   │
                            │   /api/platform  │
                            └──────────────────┘
```

### 3.2 数据加载时序图

```
用户操作         InventoryTab       useInventory      HybridCache       Adapter         API
    │                │                  │                 │                │              │
    │─── 进入页面 ──►│                  │                 │                │              │
    │                │── loadData() ──►│                 │                │              │
    │                │                  │── get(key) ───►│                │              │
    │                │                  │                 │                │              │
    │                │                  │◄── null ───────│  (缓存未命中)   │              │
    │                │                  │                 │                │              │
    │                │                  │───── getInventory() ────────────►│              │
    │                │                  │                 │                │── fetch() ──►│
    │                │                  │                 │                │              │
    │                │                  │                 │                │◄─ response ──│
    │                │                  │◄────────── items ───────────────│              │
    │                │                  │                 │                │              │
    │                │                  │── set(key) ───►│                │              │
    │                │                  │                 │── localStorage │              │
    │                │◄─ items ────────│                 │                │              │
    │◄── 渲染列表 ───│                  │                 │                │              │
    │                │                  │                 │                │              │
    │─── 手动刷新 ──►│                  │                 │                │              │
    │                │── refresh() ───►│                 │                │              │
    │                │                  │── delete(key) ►│                │              │
    │                │                  │───── getInventory(force) ──────►│              │
    │                │                  │                 │                │── fetch() ──►│
    │                │                  │◄────────── items ───────────────│              │
    │                │                  │── set(key) ───►│                │              │
    │◄── 更新UI ─────│                  │                 │                │              │
```

---

## 四、组件层级图

### 4.1 库存模块组件树

```
PlatformCenter.vue
└── InventoryTab.vue
    └── InventoryContainer.vue (容器组件)
        │
        ├── InventoryToolbar.vue (工具栏)
        │   ├── SearchInput (搜索框)
        │   ├── FilterDropdown (筛选下拉)
        │   │   ├── TradableFilter (可交易筛选)
        │   │   └── RarityFilter (稀有度筛选)
        │   ├── DisplayModeToggle (展示模式切换)
        │   │   ├── ExpandedMode (分开模式)
        │   │   └── GroupedMode (组合模式)
        │   └── RefreshButton (刷新按钮)
        │
        ├── StatsOverview.vue (统计概览)
        │   ├── TotalCount (总数量)
        │   ├── TotalCost (总成本)
        │   └── TotalProfit (预估利润)
        │
        ├── InventoryGrid.vue (网格容器)
        │   └── VirtualScroller.vue (虚拟滚动)
        │       │
        │       ├── [展开模式]
        │       │   └── ItemCard.vue (单个物品卡片) × N
        │       │       ├── ItemImage (物品图片)
        │       │       ├── ItemInfo (物品信息)
        │       │       │   ├── ItemName (名称)
        │       │       │   ├── ItemPrice (价格)
        │       │       │   └── ItemMeta (属性标签)
        │       │       ├── ItemStickers.vue (贴纸)
        │       │       ├── CostPriceInput.vue (成本输入)
        │       │       ├── ProfitDisplay (利润显示)
        │       │       └── ItemActions (操作按钮)
        │       │
        │       └── [组合模式]
        │           └── ItemCardGroup.vue (组合卡片) × M
        │               ├── GroupHeader (组头部)
        │               │   ├── ItemImage (代表图片)
        │               │   ├── GroupName (物品名称)
        │               │   ├── GroupCount (数量徽章 ×N)
        │               │   └── ExpandToggle (展开切换)
        │               ├── GroupSummary (组统计)
        │               │   ├── AverageCost (平均成本)
        │               │   └── TotalValue (总价值)
        │               └── [展开时]
        │                   └── ItemCard.vue × N
        │
        └── BatchActions.vue (批量操作)
            ├── SelectAll (全选)
            ├── SelectedCount (已选数量)
            ├── BatchList (批量上架)
            ├── BatchSetCost (批量设置成本)
            └── BatchExport (批量导出)
```

### 4.2 组件职责说明

| 组件名 | 职责 | 行数限制 |
|--------|------|----------|
| `InventoryContainer.vue` | 容器组件，管理列表状态和数据流 | ~200行 |
| `InventoryToolbar.vue` | 工具栏，搜索、筛选、模式切换 | ~150行 |
| `InventoryGrid.vue` | 网格布局，响应式调整列数 | ~100行 |
| `VirtualScroller.vue` | 虚拟滚动，性能优化 | ~250行 |
| `ItemCard.vue` | 单个物品卡片，支持分开/组合模式 | ~200行 |
| `ItemCardGroup.vue` | 组合模式卡片，折叠展示 | ~180行 |
| `BatchActions.vue` | 批量操作，选中状态管理 | ~150行 |
| `CostPriceInput.vue` | 成本价输入，支持单个/批量 | ~100行 |
| `ItemStickers.vue` | 贴纸展示，图片懒加载 | ~80行 |
| `StatsOverview.vue` | 统计概览，实时计算 | ~100行 |

---

## 五、适配器模式设计

### 5.1 平台差异对比

| 特性 | MARKET | CSGOBUY | BUFF |
|------|--------|---------|------|
| 货币 | USD | CNY | CNY |
| 汇率显示 | 需要 | 不需要 | 不需要 |
| 价格单位 | 美分 | 分 | 分 |
| 平台费率 | 5% | 5% | 2.5% |
| 物品ID字段 | `id` | `id` | `goods_id` |
| 资产ID字段 | `asset` | `assetid` | `asset_id` |
| API响应结构 | 嵌套式 | 扁平式 | 嵌套式 |
| 批量操作支持 | 是 | 是 | 部分 |
| 详情接口 | 需要classid | 需要classid | 自带详情 |

### 5.2 适配器实现

```typescript
// src/api/modules/platform/adapters/market.adapter.ts

import { BasePlatformAdapter } from './base.adapter'
import type {
  InventoryResponse,
  GetInventoryParams,
  ItemDetailResponse,
  GetItemDetailParams,
  PriceInfo
} from './types/inventory.types'
import type { InventoryItem } from '@/types/inventory'
import { PlatformType } from '@/config/platform.config'
import { platformApi } from '../index'

class MARKETAdapter extends BasePlatformAdapter {
  readonly platformType = PlatformType.MARKET
  readonly platformName = 'MARKET'
  readonly supportsExchangeRate = true

  /** 默认汇率 */
  private defaultExchangeRate = 7.2

  /**
   * 获取库存
   */
  async getInventory(params?: GetInventoryParams): Promise<InventoryResponse> {
    const response = await platformApi.getInventory({
      plantForm: 'MARKET',
      signal: params?.signal
    })

    if (!response.success) {
      throw new Error(response.message || '获取库存失败')
    }

    // 标准化物品数据
    const items = response.items.map(item => this.normalizeInventoryItem(item))

    // 生成分组数据
    const groupedItems = this.groupByMarketHashName(items)

    return {
      success: true,
      items,
      total: items.length,
      rawItems: items.filter(i => !i.detail),
      groupedItems
    }
  }

  /**
   * 获取物品详情
   */
  async getItemDetail(params: GetItemDetailParams): Promise<ItemDetailResponse> {
    const response = await platformApi.getItemDetail({
      classid: params.classId,
      instanceid: params.instanceId,
      signal: params.signal
    })

    return {
      success: response.success,
      data: this.normalizeItemDetail(response.data)
    }
  }

  /**
   * 计算利润（MARKET特有：需要考虑汇率）
   */
  calculateProfit(item: InventoryItem, exchangeRate?: number): number {
    const rate = exchangeRate || this.defaultExchangeRate
    const costPrice = item.costPrice || 0

    if (!item.marketPrice || !costPrice) {
      return 0
    }

    // MARKET价格是USD，需要转换为CNY后计算
    // 公式：(价格 × (汇率 - 0.04) × 0.95 × 0.95) - 成本
    const sellPrice = item.marketPrice * (rate - 0.04) * 0.95 * 0.95
    return Number((sellPrice - costPrice).toFixed(2))
  }

  /**
   * 标准化价格
   */
  normalizePrice(priceInfo: PriceInfo): number {
    const { rawPrice, currency, exchangeRate = this.defaultExchangeRate } = priceInfo

    if (currency === 'USD') {
      return rawPrice * exchangeRate
    }
    return rawPrice
  }

  /**
   * 标准化库存物品
   */
  private normalizeInventoryItem(raw: Record<string, any>): InventoryItem {
    return {
      id: String(raw.id || raw.asset || ''),
      assetId: String(raw.asset || raw.id || ''),
      classId: String(raw.classid || raw.class || ''),
      instanceId: String(raw.instanceid || raw.instance || '0'),
      marketHashName: raw.market_hash_name || '',
      name: raw.name || raw.market_hash_name || '',
      type: raw.type || '',
      imageUrl: raw.icon_url || raw.image || '',
      color: raw.color,
      tradable: Boolean(raw.tradable),
      marketable: Boolean(raw.marketable),
      marketPrice: raw.market_price,
      costPrice: undefined,
      loading: true,
      platformData: {
        originalPrice: raw.price,
        currency: 'USD'
      }
    }
  }

  /**
   * 标准化物品详情
   */
  private normalizeItemDetail(raw: Record<string, any>): ItemDetail {
    return {
      image: raw.image || '',
      marketName: raw.market_name || '',
      rarity: {
        rarity: raw.rarity?.rarity || '',
        rarityZh: raw.rarity?.rarity_zh || ''
      },
      exterior: raw.exterior,
      seo: {
        seoCategoryZh: raw.seo?.seo_category_zh || '',
        exteriorZh: raw.seo?.exterior_zh
      },
      stickers: raw.stickers?.map(s => ({
        name: s.name || '',
        image: s.image || '',
        wear: s.wear
      })) || []
    }
  }

  /**
   * 按市场哈希名分组
   */
  private groupByMarketHashName(items: InventoryItem[]): GroupedItems {
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
}

export const marketAdapter = new MARKETAdapter()
```

```typescript
// src/api/modules/platform/adapters/csgobuy.adapter.ts

import { BasePlatformAdapter } from './base.adapter'
import type { InventoryResponse, GetInventoryParams, PriceInfo } from './types/inventory.types'
import type { InventoryItem } from '@/types/inventory'
import { PlatformType } from '@/config/platform.config'

class CSGOBUYAdapter extends BasePlatformAdapter {
  readonly platformType = PlatformType.CSGOBUY
  readonly platformName = 'CSGOBUY'
  readonly supportsExchangeRate = false

  /**
   * 计算利润（CSGOBUY：直接CNY计算）
   */
  calculateProfit(item: InventoryItem): number {
    const costPrice = item.costPrice || 0

    if (!item.marketPrice || !costPrice) {
      return 0
    }

    // CSGOBUY公式：(价格 × 0.95 × 0.99) - 成本
    const sellPrice = item.marketPrice * 0.95 * 0.99
    return Number((sellPrice - costPrice).toFixed(2))
  }

  /**
   * 标准化价格（CSGOBUY已经是CNY）
   */
  normalizePrice(priceInfo: PriceInfo): number {
    return priceInfo.rawPrice
  }

  // ... 其他方法类似 MARKET，但字段映射不同
}

export const csgobuyAdapter = new CSGOBUYAdapter()
```

### 5.3 适配器工厂

```typescript
// src/composables/business/usePlatformAdapter.ts

import { computed, type Ref } from 'vue'
import { PlatformType } from '@/config/platform.config'
import {
  getPlatformAdapter,
  type IPlatformInventoryAdapter
} from '@/api/modules/platform/adapters'

export interface UsePlatformAdapterOptions {
  platform: PlatformType | Ref<PlatformType>
}

export function usePlatformAdapter(options: UsePlatformAdapterOptions) {
  const { platform } = options

  const currentPlatform = computed(() => {
    return typeof platform === 'object' ? platform.value : platform
  })

  const adapter = computed<IPlatformInventoryAdapter>(() => {
    return getPlatformAdapter(currentPlatform.value) as IPlatformInventoryAdapter
  })

  const supportsExchangeRate = computed(() => {
    return adapter.value.supportsExchangeRate
  })

  const platformName = computed(() => {
    return adapter.value.platformName
  })

  /**
   * 计算物品利润
   */
  const calculateProfit = (item: InventoryItem, exchangeRate?: number): number => {
    return adapter.value.calculateProfit(item, exchangeRate)
  }

  /**
   * 获取库存
   */
  const getInventory = async (params?: GetInventoryParams) => {
    return adapter.value.getInventory(params)
  }

  /**
   * 获取物品详情
   */
  const getItemDetail = async (params: GetItemDetailParams) => {
    return adapter.value.getItemDetail(params)
  }

  return {
    adapter,
    currentPlatform,
    platformName,
    supportsExchangeRate,
    calculateProfit,
    getInventory,
    getItemDetail
  }
}
```

---

## 六、缓存策略详解

### 6.1 混合缓存架构

```typescript
// src/utils/cache/hybrid-cache.ts

import { CacheManager } from './cache-manager'
import { logger } from '../logger'

const TEN_MINUTES = 10 * 60 * 1000
const STORAGE_PREFIX = 'brickbee_cache_'

export interface HybridCacheOptions<T> {
  /** 缓存名称 */
  name: string
  /** 运行时TTL（默认5分钟） */
  runtimeTTL?: number
  /** 持久化TTL（默认10分钟） */
  storageTTL?: number
  /** 最大运行时缓存数量 */
  maxSize?: number
  /** 是否启用localStorage */
  enableStorage?: boolean
  /** 数据序列化函数 */
  serializer?: (data: T) => string
  /** 数据反序列化函数 */
  deserializer?: (raw: string) => T
}

interface StorageEntry<T> {
  data: T
  timestamp: number
  version: string
}

export class HybridCache<T = unknown> {
  private runtimeCache: CacheManager<T>
  private options: Required<HybridCacheOptions<T>>
  private version = '1.0.0'

  constructor(options: HybridCacheOptions<T>) {
    this.options = {
      runtimeTTL: 5 * 60 * 1000,
      storageTTL: TEN_MINUTES,
      maxSize: 100,
      enableStorage: true,
      serializer: JSON.stringify,
      deserializer: JSON.parse,
      ...options
    }

    // 初始化运行时缓存
    this.runtimeCache = new CacheManager<T>({
      ttl: this.options.runtimeTTL,
      maxSize: this.options.maxSize,
      name: `runtime-${this.options.name}`,
      syncAcrossTabs: true
    })
  }

  /**
   * 生成存储键
   */
  private getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${this.options.name}_${key}`
  }

  /**
   * 从localStorage读取
   */
  private readFromStorage(key: string): T | null {
    if (!this.options.enableStorage) return null

    try {
      const storageKey = this.getStorageKey(key)
      const raw = localStorage.getItem(storageKey)

      if (!raw) return null

      const entry = JSON.parse(raw) as StorageEntry<T>

      // 检查版本
      if (entry.version !== this.version) {
        localStorage.removeItem(storageKey)
        return null
      }

      // 检查过期
      if (Date.now() - entry.timestamp > this.options.storageTTL) {
        localStorage.removeItem(storageKey)
        logger.log(`[HybridCache] Storage expired: ${key}`)
        return null
      }

      return this.options.deserializer(this.options.serializer(entry.data))
    } catch (e) {
      logger.warn(`[HybridCache] Failed to read from storage: ${key}`, e)
      return null
    }
  }

  /**
   * 写入localStorage
   */
  private writeToStorage(key: string, data: T): void {
    if (!this.options.enableStorage) return

    try {
      const storageKey = this.getStorageKey(key)
      const entry: StorageEntry<T> = {
        data,
        timestamp: Date.now(),
        version: this.version
      }
      localStorage.setItem(storageKey, JSON.stringify(entry))
    } catch (e) {
      logger.warn(`[HybridCache] Failed to write to storage: ${key}`, e)
      // 存储失败时尝试清理旧数据
      this.cleanupStorage()
    }
  }

  /**
   * 清理过期的localStorage数据
   */
  private cleanupStorage(): void {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const entry = JSON.parse(raw) as StorageEntry<unknown>
            if (Date.now() - entry.timestamp > this.options.storageTTL) {
              keysToRemove.push(key)
            }
          }
        } catch {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    logger.log(`[HybridCache] Cleaned up ${keysToRemove.length} expired items`)
  }

  /**
   * 获取缓存
   * 优先级：运行时缓存 > localStorage
   */
  get(key: string): T | null {
    // 1. 先查运行时缓存
    const runtimeData = this.runtimeCache.get(key)
    if (runtimeData !== null) {
      return runtimeData
    }

    // 2. 再查localStorage
    const storageData = this.readFromStorage(key)
    if (storageData !== null) {
      // 回填到运行时缓存
      this.runtimeCache.set(key, storageData)
      return storageData
    }

    return null
  }

  /**
   * 设置缓存
   * 同时更新运行时缓存和localStorage
   */
  set(key: string, data: T): void {
    this.runtimeCache.set(key, data)
    this.writeToStorage(key, data)
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    return this.runtimeCache.has(key) || this.readFromStorage(key) !== null
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.runtimeCache.delete(key)

    if (this.options.enableStorage) {
      localStorage.removeItem(this.getStorageKey(key))
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.runtimeCache.clear()

    if (this.options.enableStorage) {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`${STORAGE_PREFIX}${this.options.name}_`)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  /**
   * 获取或设置缓存
   */
  async getOrSet(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      logger.log(`[HybridCache] Cache hit: ${key}`)
      return cached
    }

    logger.log(`[HybridCache] Cache miss, fetching: ${key}`)
    const data = await fetcher()
    this.set(key, data)
    return data
  }

  /**
   * 强制刷新（忽略缓存，重新获取）
   */
  async refresh(key: string, fetcher: () => Promise<T>): Promise<T> {
    logger.log(`[HybridCache] Force refresh: ${key}`)
    this.delete(key)
    const data = await fetcher()
    this.set(key, data)
    return data
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      runtime: this.runtimeCache.getStats(),
      storage: {
        enabled: this.options.enableStorage,
        ttl: this.options.storageTTL
      }
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.runtimeCache.destroy()
  }
}

// 预定义的缓存实例
export const inventoryHybridCache = new HybridCache<InventoryItem[]>({
  name: 'inventory',
  runtimeTTL: 5 * 60 * 1000,
  storageTTL: 10 * 60 * 1000
})

export const sellingHybridCache = new HybridCache<SellingItem[]>({
  name: 'selling',
  runtimeTTL: 3 * 60 * 1000,
  storageTTL: 10 * 60 * 1000
})
```

### 6.2 缓存使用流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        首次加载流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 检查运行时缓存 (CacheManager)                                │
│     │                                                           │
│     ├── 命中 ──► 直接返回数据                                    │
│     │                                                           │
│     └── 未命中                                                  │
│           │                                                     │
│  2. 检查 localStorage                                           │
│     │                                                           │
│     ├── 存在且未过期 ──► 回填运行时缓存 ──► 返回数据              │
│     │                                                           │
│     └── 不存在或已过期                                          │
│           │                                                     │
│  3. 调用 API 获取数据                                           │
│     │                                                           │
│  4. 更新运行时缓存                                               │
│     │                                                           │
│  5. 更新 localStorage                                           │
│     │                                                           │
│  6. 返回数据                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        手动刷新流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 删除运行时缓存                                               │
│     │                                                           │
│  2. 删除 localStorage 缓存                                       │
│     │                                                           │
│  3. 调用 API 获取最新数据                                        │
│     │                                                           │
│  4. 更新运行时缓存                                               │
│     │                                                           │
│  5. 更新 localStorage                                           │
│     │                                                           │
│  6. 返回数据                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 七、关键代码示例

### 7.1 智能加载管理器 (TypeScript版本)

```typescript
// src/composables/business/useSmartLoading.ts

import { ref, onBeforeUnmount, getCurrentInstance, type Ref } from 'vue'

export interface SmartLoadingOptions {
  /** 最大并发数 */
  maxConcurrent?: number
  /** 视口边距 */
  viewportMargin?: string
  /** 滚动防抖延迟 */
  scrollDebounce?: number
  /** 快速滚动阈值 (px/s) */
  fastScrollThreshold?: number
}

interface LoadingItem<T> {
  item: T
  element: HTMLElement
  controller?: AbortController
}

interface QueueItem<T> {
  item: T
  addedAt: number
  priority: number
}

interface LoadingStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cancelledRequests: number
}

export class SmartLoadingManager<T extends { id: string; detail?: unknown; loading?: boolean }> {
  private options: Required<SmartLoadingOptions>
  private items = new Map<string, T>()
  private loadingItems = new Map<string, AbortController>()
  private loadedItems = new Set<string>()
  private waitingQueue = new Map<string, QueueItem<T>>()
  private observer: IntersectionObserver | null = null
  private fetchFunction: ((item: T, signal: AbortSignal) => Promise<unknown>) | null = null

  private isScrolling = false
  private isFastScrolling = false
  private scrollTimer: ReturnType<typeof setTimeout> | null = null
  private handleScroll: (() => void) | null = null

  private stats: LoadingStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cancelledRequests: 0
  }

  constructor(options: SmartLoadingOptions = {}) {
    this.options = {
      maxConcurrent: 3,
      viewportMargin: '100px',
      scrollDebounce: 150,
      fastScrollThreshold: 1000,
      ...options
    }

    this.setupObserver()
    this.setupScrollListener()
  }

  /**
   * 设置获取函数
   */
  setFetchFunction(fn: (item: T, signal: AbortSignal) => Promise<unknown>): void {
    this.fetchFunction = fn
  }

  /**
   * 注册物品
   */
  registerItem(item: T, element: HTMLElement): void {
    if (!item || !item.id) return
    if (this.items.has(item.id) || item.detail) return

    this.items.set(item.id, item)

    if (this.observer && element) {
      element.dataset.itemId = item.id
      this.observer.observe(element)
    }
  }

  /**
   * 设置视口观察器
   */
  private setupObserver(): void {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = (entry.target as HTMLElement).dataset.itemId
          if (!itemId) return

          const item = this.items.get(itemId)
          if (!item) return

          if (entry.isIntersecting) {
            this.onItemEnterViewport(item)
          } else {
            this.onItemLeaveViewport(item)
          }
        })
      },
      {
        rootMargin: this.options.viewportMargin,
        threshold: 0.1
      }
    )
  }

  /**
   * 设置滚动监听
   */
  private setupScrollListener(): void {
    if (typeof window === 'undefined') return

    let lastScrollY = window.scrollY
    let lastTime = Date.now()

    this.handleScroll = () => {
      const currentTime = Date.now()
      const currentScrollY = window.scrollY

      const timeDiff = currentTime - lastTime
      const scrollDiff = Math.abs(currentScrollY - lastScrollY)
      const scrollSpeed = timeDiff > 0 ? (scrollDiff / timeDiff) * 1000 : 0

      this.isScrolling = true
      this.isFastScrolling = scrollSpeed > this.options.fastScrollThreshold

      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer)
      }

      this.scrollTimer = setTimeout(() => {
        this.isScrolling = false
        this.isFastScrolling = false
        this.processNextItem()
      }, this.options.scrollDebounce)

      lastScrollY = currentScrollY
      lastTime = currentTime
    }

    window.addEventListener('scroll', this.handleScroll, { passive: true })
  }

  /**
   * 物品进入视口
   */
  private onItemEnterViewport(item: T): void {
    if (item.detail || this.loadingItems.has(item.id) || this.loadedItems.has(item.id)) {
      return
    }

    if (!this.waitingQueue.has(item.id)) {
      this.waitingQueue.set(item.id, {
        item,
        addedAt: Date.now(),
        priority: 0
      })
    }

    if (!this.isFastScrolling) {
      this.processNextItem()
    }
  }

  /**
   * 物品离开视口
   */
  private onItemLeaveViewport(item: T): void {
    // 从等待队列移除
    this.waitingQueue.delete(item.id)

    // 取消正在加载的请求
    const controller = this.loadingItems.get(item.id)
    if (controller) {
      controller.abort()
      item.loading = false
      this.loadingItems.delete(item.id)
      this.stats.cancelledRequests++
      this.processNextItem()
    }
  }

  /**
   * 处理下一个物品
   */
  private processNextItem(): void {
    if (this.isFastScrolling) return
    if (this.loadingItems.size >= this.options.maxConcurrent) return
    if (this.waitingQueue.size === 0) return

    const [itemId, queueItem] = this.waitingQueue.entries().next().value
    this.waitingQueue.delete(itemId)
    this.startLoading(queueItem.item)
  }

  /**
   * 开始加载物品
   */
  private async startLoading(item: T): Promise<void> {
    if (!this.fetchFunction) return

    const controller = new AbortController()
    this.loadingItems.set(item.id, controller)
    item.loading = true
    this.stats.totalRequests++

    try {
      const detail = await this.fetchFunction(item, controller.signal)
      ;(item as any).detail = detail
      item.loading = false
      this.stats.successfulRequests++
      this.loadedItems.add(item.id)
      this.stopObservingItem(item.id)
    } catch (error: any) {
      item.loading = false

      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        this.stats.cancelledRequests++
      } else {
        this.stats.failedRequests++
      }
    } finally {
      this.loadingItems.delete(item.id)
      this.processNextItem()
    }
  }

  /**
   * 停止观察物品
   */
  private stopObservingItem(itemId: string): void {
    const element = document.querySelector(`[data-item-id="${itemId}"]`)
    if (element && this.observer) {
      this.observer.unobserve(element)
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      totalItems: this.items.size,
      currentlyLoading: this.loadingItems.size,
      waitingInQueue: this.waitingQueue.size,
      loadedCount: this.loadedItems.size,
      isScrolling: this.isScrolling,
      isFastScrolling: this.isFastScrolling
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.handleScroll) {
      window.removeEventListener('scroll', this.handleScroll)
    }

    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
    }

    if (this.observer) {
      this.observer.disconnect()
    }

    this.loadingItems.forEach((controller) => controller.abort())
    this.items.clear()
    this.loadingItems.clear()
    this.loadedItems.clear()
    this.waitingQueue.clear()
  }
}

/**
 * 智能加载 Composable
 */
export function useSmartLoading<T extends { id: string; detail?: unknown; loading?: boolean }>(
  options: SmartLoadingOptions = {}
) {
  const instance = getCurrentInstance()

  if (!instance) {
    console.warn('[useSmartLoading] Must be called within Vue component')
    return {
      manager: null,
      registerItem: () => {},
      setFetchFunction: () => {},
      getStats: () => ({})
    }
  }

  const manager = new SmartLoadingManager<T>(options)

  onBeforeUnmount(() => {
    manager.destroy()
  })

  return {
    manager,
    registerItem: (item: T, element: HTMLElement) => manager.registerItem(item, element),
    setFetchFunction: (fn: (item: T, signal: AbortSignal) => Promise<unknown>) =>
      manager.setFetchFunction(fn),
    getStats: () => manager.getStats()
  }
}
```

### 7.2 物品展示模式管理

```typescript
// src/composables/business/useItemDisplay.ts

import { ref, computed, type Ref } from 'vue'
import type { InventoryItem, GroupedItems, DisplayMode } from '@/types/inventory'

export interface UseItemDisplayOptions {
  /** 物品列表 */
  items: Ref<InventoryItem[]>
  /** 默认展示模式 */
  defaultMode?: DisplayMode
  /** 持久化键名 */
  storageKey?: string
}

export interface UseItemDisplayReturn {
  /** 当前展示模式 */
  displayMode: Ref<DisplayMode>
  /** 是否展开模式 */
  isExpanded: Ref<boolean>
  /** 分组后的物品 */
  groupedItems: Ref<GroupedItems>
  /** 当前展示的物品/组 */
  displayItems: Ref<InventoryItem[] | GroupedItems>
  /** 展开的组名集合 */
  expandedGroups: Ref<Set<string>>
  /** 切换展示模式 */
  toggleMode: () => void
  /** 设置展示模式 */
  setMode: (mode: DisplayMode) => void
  /** 切换组展开状态 */
  toggleGroup: (groupName: string) => void
  /** 展开所有组 */
  expandAll: () => void
  /** 收起所有组 */
  collapseAll: () => void
}

export function useItemDisplay(options: UseItemDisplayOptions): UseItemDisplayReturn {
  const { items, defaultMode = 'expanded', storageKey = 'display_mode' } = options

  // 从localStorage恢复展示模式
  const savedMode = localStorage.getItem(storageKey) as DisplayMode | null
  const displayMode = ref<DisplayMode>(savedMode || defaultMode)

  // 展开的组
  const expandedGroups = ref<Set<string>>(new Set())

  // 是否展开模式
  const isExpanded = computed(() => displayMode.value === 'expanded')

  // 分组物品
  const groupedItems = computed<GroupedItems>(() => {
    const groups: GroupedItems = {}

    for (const item of items.value) {
      const name = item.marketHashName
      if (!groups[name]) {
        groups[name] = []
      }
      groups[name].push(item)
    }

    return groups
  })

  // 当前展示的物品/组
  const displayItems = computed(() => {
    if (displayMode.value === 'expanded') {
      return items.value
    }
    return groupedItems.value
  })

  /**
   * 切换展示模式
   */
  const toggleMode = (): void => {
    displayMode.value = displayMode.value === 'expanded' ? 'grouped' : 'expanded'
    localStorage.setItem(storageKey, displayMode.value)
  }

  /**
   * 设置展示模式
   */
  const setMode = (mode: DisplayMode): void => {
    displayMode.value = mode
    localStorage.setItem(storageKey, mode)
  }

  /**
   * 切换组展开状态
   */
  const toggleGroup = (groupName: string): void => {
    if (expandedGroups.value.has(groupName)) {
      expandedGroups.value.delete(groupName)
    } else {
      expandedGroups.value.add(groupName)
    }
  }

  /**
   * 展开所有组
   */
  const expandAll = (): void => {
    expandedGroups.value = new Set(Object.keys(groupedItems.value))
  }

  /**
   * 收起所有组
   */
  const collapseAll = (): void => {
    expandedGroups.value.clear()
  }

  return {
    displayMode,
    isExpanded,
    groupedItems,
    displayItems,
    expandedGroups,
    toggleMode,
    setMode,
    toggleGroup,
    expandAll,
    collapseAll
  }
}
```

### 7.3 批量操作管理

```typescript
// src/composables/business/useBatchOperation.ts

import { ref, computed, type Ref } from 'vue'
import type { InventoryItem } from '@/types/inventory'

export interface UseBatchOperationOptions {
  /** 物品列表 */
  items: Ref<InventoryItem[]>
  /** 最大选择数量 */
  maxSelection?: number
}

export interface BatchOperationResult {
  success: boolean
  successCount: number
  failedCount: number
  errors: Array<{ itemId: string; error: string }>
}

export function useBatchOperation(options: UseBatchOperationOptions) {
  const { items, maxSelection = Infinity } = options

  // 已选择的物品ID
  const selectedIds = ref<Set<string>>(new Set())

  // 是否正在执行批量操作
  const isProcessing = ref(false)

  // 已选择的物品
  const selectedItems = computed(() => {
    return items.value.filter(item => selectedIds.value.has(item.id))
  })

  // 选择数量
  const selectedCount = computed(() => selectedIds.value.size)

  // 是否全选
  const isAllSelected = computed(() => {
    return items.value.length > 0 && selectedIds.value.size === items.value.length
  })

  // 是否部分选择
  const isPartialSelected = computed(() => {
    return selectedIds.value.size > 0 && selectedIds.value.size < items.value.length
  })

  /**
   * 选择/取消选择物品
   */
  const toggleSelect = (itemId: string): void => {
    if (selectedIds.value.has(itemId)) {
      selectedIds.value.delete(itemId)
    } else if (selectedIds.value.size < maxSelection) {
      selectedIds.value.add(itemId)
    }
  }

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = (): void => {
    if (isAllSelected.value) {
      selectedIds.value.clear()
    } else {
      const idsToSelect = items.value
        .slice(0, maxSelection)
        .map(item => item.id)
      selectedIds.value = new Set(idsToSelect)
    }
  }

  /**
   * 清空选择
   */
  const clearSelection = (): void => {
    selectedIds.value.clear()
  }

  /**
   * 批量设置成本价
   */
  const batchSetCostPrice = async (
    price: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<BatchOperationResult> => {
    isProcessing.value = true
    const errors: Array<{ itemId: string; error: string }> = []
    let successCount = 0

    try {
      const selectedList = selectedItems.value

      for (let i = 0; i < selectedList.length; i++) {
        const item = selectedList[i]

        try {
          item.costPrice = price
          successCount++
        } catch (e: any) {
          errors.push({ itemId: item.id, error: e.message })
        }

        onProgress?.(i + 1, selectedList.length)
      }

      return {
        success: errors.length === 0,
        successCount,
        failedCount: errors.length,
        errors
      }
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 批量上架
   */
  const batchList = async (
    price: number,
    adapter: { batchList: (items: InventoryItem[], price: number) => Promise<any> },
    onProgress?: (current: number, total: number) => void
  ): Promise<BatchOperationResult> => {
    isProcessing.value = true

    try {
      const result = await adapter.batchList(selectedItems.value, price)
      return {
        success: result.success,
        successCount: result.results?.filter((r: any) => r.success).length || 0,
        failedCount: result.results?.filter((r: any) => !r.success).length || 0,
        errors: result.results?.filter((r: any) => !r.success).map((r: any) => ({
          itemId: r.itemId,
          error: r.error
        })) || []
      }
    } finally {
      isProcessing.value = false
    }
  }

  return {
    selectedIds,
    selectedItems,
    selectedCount,
    isAllSelected,
    isPartialSelected,
    isProcessing,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    batchSetCostPrice,
    batchList
  }
}
```

### 7.4 虚拟滚动组件示例

```vue
<!-- src/components/inventory/VirtualScroller.vue -->
<script setup lang="ts">
/**
 * 虚拟滚动组件
 *
 * 支持大量物品的高性能渲染
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

interface Props {
  /** 物品列表 */
  items: any[]
  /** 物品高度 */
  itemHeight: number
  /** 容器高度 */
  containerHeight?: number
  /** 缓冲区大小 */
  buffer?: number
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 600,
  buffer: 5
})

const emit = defineEmits<{
  (e: 'visible-change', items: any[]): void
}>()

// DOM 引用
const containerRef = ref<HTMLElement | null>(null)

// 滚动位置
const scrollTop = ref(0)

// 可见范围
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)

  return {
    start: Math.max(0, start - props.buffer),
    end: Math.min(props.items.length, start + visibleCount + props.buffer)
  }
})

// 可见物品
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  return props.items.slice(start, end).map((item, index) => ({
    ...item,
    _virtualIndex: start + index
  }))
})

// 总高度
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 偏移量
const offsetY = computed(() => visibleRange.value.start * props.itemHeight)

// 滚动处理
let ticking = false
const handleScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop
      }
      ticking = false
    })
    ticking = true
  }
}

// 监听可见物品变化
watch(visibleItems, (items) => {
  emit('visible-change', items)
})

onMounted(() => {
  containerRef.value?.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-scroller"
    :style="{ height: `${containerHeight}px` }"
  >
    <div
      class="virtual-scroller__spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="virtual-scroller__content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.id || item._virtualIndex"
          class="virtual-scroller__item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="item._virtualIndex" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.virtual-scroller {
  overflow-y: auto;
  position: relative;

  &__spacer {
    position: relative;
  }

  &__content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    will-change: transform;
  }

  &__item {
    box-sizing: border-box;
  }

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}
</style>
```

---

## 八、迁移指南

### 8.1 迁移步骤

1. **阶段一：类型定义和适配器**
   - 创建 TypeScript 类型定义文件
   - 扩展平台适配器，实现标准化接口
   - 编写单元测试

2. **阶段二：Composables 层**
   - 实现 `useSmartLoading.ts`
   - 实现 `useItemDisplay.ts`
   - 实现 `useBatchOperation.ts`
   - 扩展 `useInventory.ts`

3. **阶段三：组件拆分**
   - 拆分 `InventoryItems.vue` (1500行) 为多个小组件
   - 实现虚拟滚动组件
   - 实现物品卡片组件

4. **阶段四：Store 和缓存**
   - 实现混合缓存策略
   - 扩展 Pinia Store
   - 迁移 localStorage 逻辑

5. **阶段五：视图层集成**
   - 更新 `InventoryTab.vue`
   - 更新 `SellingTab.vue`
   - 测试所有平台

### 8.2 兼容性注意事项

- 保持与后端 API 的兼容性
- 保留原有的 localStorage 数据结构（或提供迁移脚本）
- 确保汇率显示逻辑只在 MARKET 平台生效

---

## 九、测试策略

### 9.1 单元测试

```typescript
// tests/composables/useSmartLoading.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSmartLoading } from '@/composables/business/useSmartLoading'

describe('useSmartLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should register item correctly', () => {
    const { registerItem, getStats } = useSmartLoading()
    const item = { id: '1', detail: undefined }
    const element = document.createElement('div')

    registerItem(item, element)

    expect(getStats().totalItems).toBe(1)
  })

  it('should not register item with detail', () => {
    const { registerItem, getStats } = useSmartLoading()
    const item = { id: '1', detail: { image: 'test' } }
    const element = document.createElement('div')

    registerItem(item, element)

    expect(getStats().totalItems).toBe(0)
  })

  it('should respect maxConcurrent limit', async () => {
    const { manager, setFetchFunction } = useSmartLoading({ maxConcurrent: 2 })

    const mockFetch = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    setFetchFunction(mockFetch)

    // 注册3个物品
    for (let i = 0; i < 3; i++) {
      const item = { id: String(i), detail: undefined }
      const element = document.createElement('div')
      manager.registerItem(item, element)
    }

    // 触发加载后检查并发数
    await vi.advanceTimersByTimeAsync(50)
    expect(manager.getStats().currentlyLoading).toBeLessThanOrEqual(2)
  })
})
```

### 9.2 组件测试

```typescript
// tests/components/ItemCard.test.ts

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemCard from '@/components/inventory/ItemCard.vue'

describe('ItemCard', () => {
  it('should render item name', () => {
    const wrapper = mount(ItemCard, {
      props: {
        item: {
          id: '1',
          marketHashName: 'AK-47 | Redline',
          name: 'AK-47 | 红线',
          tradable: true
        }
      }
    })

    expect(wrapper.text()).toContain('AK-47')
  })

  it('should show loading state', () => {
    const wrapper = mount(ItemCard, {
      props: {
        item: {
          id: '1',
          marketHashName: 'Test',
          loading: true
        }
      }
    })

    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })
})
```

---

## 十、性能优化建议

1. **虚拟滚动**：使用虚拟滚动处理大量物品（>100）
2. **图片懒加载**：使用 IntersectionObserver 实现
3. **防抖/节流**：搜索输入、滚动事件
4. **Web Worker**：将价格计算等密集任务移至 Worker
5. **分页加载**：首屏只加载20-50个物品
6. **缓存策略**：合理利用运行时缓存和 localStorage

---

## 十一、总结

本架构文档提供了一个完整的重构方案，包括：

- 统一的适配器模式处理平台差异
- 混合缓存策略提升性能
- 组件化设计保证可维护性
- TypeScript 类型安全
- 完善的测试策略

通过遵循本文档，可以将旧项目的业务逻辑平滑迁移到新的 TypeScript 架构中，同时保持代码质量和可扩展性。
