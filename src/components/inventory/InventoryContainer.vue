<script setup lang="ts">
/**
 * 库存容器组件
 *
 * 整合工具栏、网格等子组件，管理库存页面状态
 */

import { ref, computed, watch, onMounted, provide } from 'vue'
import { PlatformType } from '@/config/platform.config'
import type { InventoryItem, GroupStats } from '@/types/inventory'
import { usePlatformAdapter } from '@/composables/platform/usePlatformAdapter'
import { useItemDisplay } from '@/composables/platform/useItemDisplay'
import { useBatchOperation } from '@/composables/platform/useBatchOperation'
import { useCostPrice } from '@/composables/platform/useCostPrice'
import { useSmartLoading } from '@/composables/platform/useSmartLoading'
import InventoryToolbar from './InventoryToolbar.vue'
import InventoryGrid from './InventoryGrid.vue'

// Props
const props = withDefaults(
  defineProps<{
    platform: PlatformType
    items: InventoryItem[]
    loading?: boolean
  }>(),
  {
    loading: false
  }
)

// Emits
const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'load-detail', item: InventoryItem): void
}>()

// Composables
const {
  adapter,
  platformName,
  supportsExchangeRate,
  exchangeRate,
  setExchangeRate,
  getCurrencySymbol
} = usePlatformAdapter()

const itemsRef = () => filteredItems.value

const { displayMode, groupedItems, groupNames, toggleDisplayMode, toggleGroup, expandedGroups } =
  useItemDisplay(itemsRef)

const {
  isBatchMode,
  selectedIds,
  selectedCount,
  toggleBatchMode,
  toggleItem,
  selectAll,
  clearSelection
} = useBatchOperation(itemsRef)

const {
  costPrices,
  setCostPrice,
  setGroupCostPrices,
  calculateGroupStats,
  getItemProfit,
  getGroupTotalProfit
} = useCostPrice(() => props.platform)

const { registerItem, setFetchFunction } = useSmartLoading()

// 搜索
const searchQuery = ref('')

// 过滤后的物品
const filteredItems = computed(() => {
  let result = props.items

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.marketHashName.toLowerCase().includes(query)
    )
  }

  // 应用成本价
  return result.map(item => ({
    ...item,
    costPrice: costPrices.value[item.id] ?? item.costPrice
  }))
})

// 分组统计
const groupStats = computed(() => {
  const stats: Record<string, GroupStats> = {}
  groupNames.value.forEach(name => {
    stats[name] = calculateGroupStats(groupedItems.value[name])
  })
  return stats
})

// 分组利润
const groupProfits = computed(() => {
  const profits: Record<string, number | null> = {}
  groupNames.value.forEach(name => {
    profits[name] = getGroupTotalProfit(groupedItems.value[name])
  })
  return profits
})

// 货币符号
const currencySymbol = computed(() => getCurrencySymbol())

// 处理搜索
function handleSearch(value: string): void {
  searchQuery.value = value
}

// 处理刷新
function handleRefresh(): void {
  emit('refresh')
}

// 处理物品选择
function handleItemSelect(item: InventoryItem): void {
  if (isBatchMode.value) {
    toggleItem(item.id)
  }
}

// 处理成本价变化
function handleCostChange(item: InventoryItem, value: number): void {
  setCostPrice(item.id, value)
}

// 处理分组成本价变化
function handleGroupCostChange(items: InventoryItem[], value: number): void {
  setGroupCostPrices(items, value)
}

// 处理物品 ref（用于智能加载）
function handleItemRef(el: HTMLElement | null, item: InventoryItem): void {
  if (el && !item.detail) {
    registerItem(item, el)
  }
}

// 处理汇率变化
function handleExchangeRateChange(value: number): void {
  setExchangeRate(value)
}

// 设置物品详情加载函数
onMounted(() => {
  setFetchFunction(async (item: InventoryItem, signal: AbortSignal) => {
    emit('load-detail', item)
    // 实际加载由父组件处理
    return new Promise((resolve, reject) => {
      const checkDetail = setInterval(() => {
        if (signal.aborted) {
          clearInterval(checkDetail)
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }
        if (item.detail) {
          clearInterval(checkDetail)
          resolve(item.detail)
        }
      }, 100)

      // 超时处理
      setTimeout(() => {
        clearInterval(checkDetail)
        if (!item.detail) {
          reject(new Error('加载超时'))
        }
      }, 30000)
    })
  })
})

// Provide 给子组件
provide('platform', props.platform)
provide('adapter', adapter)
</script>

<template>
  <div class="inventory-container">
    <!-- 工具栏 -->
    <InventoryToolbar :total-count="filteredItems.length" :display-mode="displayMode" :group-count="groupNames.length"
      :loading="loading" :selected-count="selectedCount" :batch-mode="isBatchMode" :platform-name="platformName"
      :exchange-rate="exchangeRate" :show-exchange-rate="supportsExchangeRate" @search="handleSearch"
      @toggle-mode="toggleDisplayMode" @refresh="handleRefresh" @toggle-batch="toggleBatchMode" @select-all="selectAll"
      @clear-selection="clearSelection" @exchange-rate-change="handleExchangeRateChange" />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>正在加载库存数据...</span>
    </div>

    <!-- 库存网格 -->
    <InventoryGrid v-else :items="filteredItems" :grouped-items="groupedItems" :display-mode="displayMode"
      :expanded-groups="expandedGroups" :group-stats="groupStats" :group-profits="groupProfits" :show-cost="true"
      :currency-symbol="currencySymbol" :selectable="isBatchMode" :selected-ids="selectedIds"
      @toggle-group="toggleGroup" @item-select="handleItemSelect" @cost-change="handleCostChange"
      @group-cost-change="handleGroupCostChange" @item-ref="handleItemRef" />
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #6e72e5;
$border-color: #e6e8f0;
$text-secondary: #6b7280;

.inventory-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 12px;
  gap: 16px;
  color: $text-secondary;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($primary-color, 0.2);
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
