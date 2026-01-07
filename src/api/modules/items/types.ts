/**
 * 物品相关类型定义
 */

/**
 * 筛选器选项
 */
export interface FilterOption {
  filterId: string
  types?: Array<string>
  zone?: object,
  optionIds: Array<string>
  optionLabel?: string
  optionClassName?: string
}

/**
 * 物品列表查询参数
 */
export interface ItemListParams {
  start?: number
  pageSize?: number
  filters?: FilterOption[]
}

/**
 * Steam 物品信息
 */
export interface SteamItem {
  // 基本信息
  item_id: number
  market_hash_name: string
  market_name: string
  image_300?: string

  // 价格信息
  price_buff?: string
  price_c5?: string
  price_csgobuy?: string
  price_youpin?: string
  price_haloskins?: string
  price_market?: string
  price_steam?: string
  min_cn_platform?: string
  min_cn_price?: string

  // 销量信息
  market_volume?: number
  csgobuy_volume?: number
  buff_volume?: number
  c5_volume?: number
  youpin_volume?: number
  haloskins_volume?: number
  steam_volume?: number

  // 热度/周销量
  market_popularity?: number
  csgobuy_popularity?: number
  market_ctp?: number
  csgobuy_ctp?: number

  // 利润信息
  profit_to_market?: string
  profit_rate_to_market?: string
  profit_to_csgobuy?: string
  profit_rate_to_csgobuy?: string

  // 更新时间
  update_buff?: number
  update_c5?: number
  update_csgobuy?: string
  update_youpin?: number
  update_market?: string
  update_steam?: number
  last_update?: string

  // 汇率
  usd_cny?: string

  [key: string]: any
}

/**
 * 物品列表响应
 */
export interface ItemListResponse {
  list: SteamItem[]
  total: number
}

/**
 * 单个物品查询参数
 */
export interface ItemDetailParams {
  market_hash_name: string
}

/**
 * 批量物品查询参数
 */
export interface BatchItemParams {
  market_hash_names: string[]
}



// --------------------------------------------------------------------------
// 3. 筛选器常量定义
// --------------------------------------------------------------------------


/**
 * SEO 分类选项
 */
export const SEO_CATEGORIES = {
  ALL: { id: 'all', label: '不限' },
  PISTOL: { id: 'Pistol', label: '手枪' },
  RIFLE: { id: 'Rifle', label: '步枪' },
  SMG: { id: 'SMG', label: '冲锋枪' },
  SNIPER: { id: 'SniperRifle', label: '狙击枪' },
  SHOTGUN: { id: 'Shotgun', label: '霰弹枪' },
  MACHINEGUN: { id: 'Machinegun', label: '机枪' },
  KNIFE: { id: 'Knife', label: '匕首' },
  GLOVES: { id: 'Gloves', label: '手套' },
  AGENT: { id: 'Agent', label: '特工' },
  STICKER: { id: 'Sticker', label: '贴纸' },
  MUSIC: { id: 'MusicKit', label: '音乐盒' },
  OTHER: { id: 'Other', label: '其他' },
} as const;

/**
 * 稀有度选项
 */
export const RARITY_OPTIONS = {
  ALL: { id: 'all', label: '不限' },
  CONSUMER: { id: '1', label: '消费级' },
  INDUSTRIAL: { id: '2', label: '工业级' },
  MIL_SPEC: { id: '3', label: '军规级' },
  RESTRICTED: { id: '4', label: '受限' },
  CLASSIFIED: { id: '5', label: '保密' },
  COVERT: { id: '6', label: '隐秘' },
  CONTRABAND: { id: '7', label: '违禁' },
} as const;

/**
 * 排序选项
 */
export const SORTING_OPTIONS = {
  MARKET_VOLUME: { id: 'market', label: 'MARKET周销量⬇' },
  CSGOBUY_VOLUME: { id: 'csgobuy', label: 'CSGOBuy热度⬇' },
} as const;

/**
 * 平台显示选项
 */
export const PLATFORM_OPTIONS = {
  ALL: { id: 'all', label: '显示全部出售平台' },
  LOWEST: { id: 'lowest', label: '显示最低平台' },
} as const;

// --------------------------------------------------------------------------
// 完整使用示例
// --------------------------------------------------------------------------

/*
// 在 Vue 组件中使用

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { itemsApi, type SteamItem, type FilterOption } from '@/api/modules/items';

// 响应式数据
const items = ref<SteamItem[]>([]);
const total = ref(0);
const loading = ref(false);

// 筛选条件
const filters = ref<FilterOption[]>([
  { filterId: 'seo', optionId: 'Rifle' },
  { filterId: 'rarity', optionId: '5' },
]);

// 获取物品列表
const fetchItems = async () => {
  loading.value = true;
  try {
    const result = await itemsApi.getList({
      start: 0,
      pageSize: 30,
      filters: filters.value,
    });

    items.value = result.list;
    total.value = result.total;
    logge.log('物品总数:', total.value);
  } catch (error) {
    logge.error('获取物品列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = async () => {
  const result = await itemsApi.getList({
    start: items.value.length,
    pageSize: 30,
    filters: filters.value,
  });

  items.value = [...items.value, ...result.list];
  total.value = result.total;
};

// 添加筛选条件
const addFilter = (filter: FilterOption) => {
  // 移除同类筛选
  filters.value = filters.value.filter(f => f.filterId !== filter.filterId);
  // 添加新筛选
  filters.value.push(filter);
  // 重新查询
  fetchItems();
};

// 移除筛选条件
const removeFilter = (filterId: string) => {
  filters.value = filters.value.filter(f => f.filterId !== filterId);
  fetchItems();
};

// 页面加载时执行
onMounted(() => {
  fetchItems();
});
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>

    <div v-else>
      <div v-for="item in items" :key="item.market_hash_name">
        <h3>{{ item.name }}</h3>
        <p>{{ item.name_zh }}</p>
        <img :src="item.image_url" :alt="item.name" />
      </div>

      <button @click="loadMore">加载更多</button>
    </div>
  </div>
</template>
*/
