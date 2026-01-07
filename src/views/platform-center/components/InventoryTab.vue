<script setup lang="ts">
/**
 * 库存 Tab 组件
 *
 * 显示指定平台的库存数据，支持：
 * - 自动加载/刷新库存
 * - 编辑成本价
 * - 合并/展开相同物品
 * - 批量操作
 * - 卡片式网格布局 (参考 brickbee-frontend InventoryItems 样式)
 *
 * 架构说明：
 * - Store (Pinia): 只存储数据 (rawItems, loading, error...)
 * - Composables: 所有业务逻辑处理
 *   - useInventoryLogic: 筛选/排序/分组/统计/选择
 *   - useInventoryService: 数据加载/刷新
 *   - useCostPrice: 成本价管理
 *   - usePlatformAdapter: 平台信息/格式化
 */

import { ref, onMounted, watch, computed } from 'vue'
import { usePlatformStore } from '@/stores/modules/platform'
import { useInventoryStore } from '@/stores/modules/inventory'
import { usePlatformAdapter } from '@/composables/platform/usePlatformAdapter'
import { useCostPrice } from '@/composables/platform/useCostPrice'
import { useInventoryLogic } from '@/composables/platform/inventory/useInventoryLogic'
import { useInventoryService } from '@/composables/platform/inventory/useInventoryService'
import type { PlatformType } from '@/config/platform.config'
import type { InventoryItem } from '@/types/inventory'

// 公共组件
import {
  ItemCard,
  ItemGrid,
  GroupCard,
  LoadingSpinner,
  type BaseItem
} from '@/components/common/item'

// --------------------------------------------------------------------------
// Props
// --------------------------------------------------------------------------

const props = defineProps<{
  platform: PlatformType
}>()

// --------------------------------------------------------------------------
// Store & Composable
// --------------------------------------------------------------------------

const platformStore = usePlatformStore()
const inventoryStore = useInventoryStore()
const { formatPrice, getCurrencySymbol, exchangeRate } = usePlatformAdapter()

// 库存逻辑 - 筛选、排序、分组、统计、选择
const {
  displayMode,
  displayItems,
  groupedItems,
  stats,
  isBatchMode,
  selectedIds,
  toggleDisplayMode,
  toggleGroup,
  isGroupExpanded,
  getGroupItems,
  getGroupCount,
  selectItem,
  selectAll,
  clearSelection,
  isSelected
} = useInventoryLogic(
  () => inventoryStore.rawItems,
  () => props.platform,
  { exchangeRate }
)

// 库存服务 - 数据加载
const { fetchInventory, refreshInventory } = useInventoryService()

// 成本价管理
const {
  editingId,
  editValue,
  startEdit,
  cancelEdit,
  confirmEdit,
  isEditing,
  getCostPrice,
  setGroupCostPrices,
  getItemProfit,
  getGroupTotalProfit,
  calculateGroupStats
} = useCostPrice(() => props.platform)

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------

const usdCnyRate = ref(7.18)

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

const loading = computed(() => inventoryStore.loading)
const refreshing = computed(() => inventoryStore.refreshing)
const error = computed(() => inventoryStore.error)

const currencySymbol = computed(() => getCurrencySymbol())

// 转换为 BaseItem 格式
const itemsAsBaseItems = computed(() => {
  return displayItems.value.map(item => ({
    id: item.id,
    name: item.name,
    marketHashName: item.marketHashName,
    imageUrl: item.imageUrl,
    marketPrice: item.marketPrice,
    costPrice: getCostPrice(item.id) ?? item.costPrice,
    tradable: item.tradable ?? true,
    cooldown: item.cooldown,
    detail: item.detail
  } as BaseItem))
})

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

const handleRefresh = async () => {
  await fetchInventory()
}

const handleToggleDisplayMode = () => {
  toggleDisplayMode()
}

const handleToggleGroup = (marketHashName: string) => {
  toggleGroup(marketHashName)
}

const handleEditCost = (item: BaseItem) => {
  const currentCost = getCostPrice(item.id) ?? (item as InventoryItem).costPrice ?? 0
  startEdit(item.id, currentCost)
}

const handleSaveCost = (_item: BaseItem, value: number) => {
  editValue.value = String(value)
  confirmEdit()
}

const handleCancelEdit = () => {
  cancelEdit()
}

const handleAddTask = (item: BaseItem) => {
  alert(`已添加到任务：${item.name || item.marketHashName}`)
}

const handleSetGroupCostPrice = (marketHashName: string, price: number) => {
  const items = getGroupItems(marketHashName)
  setGroupCostPrices(items, price)
}

const formatPriceDisplay = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '-'
  return `${currencySymbol.value}${price.toFixed(2)}`
}

// 获取分组信息
const getGroupInfo = (marketHashName: string) => {
  const items = getGroupItems(marketHashName)
  const groupStats = calculateGroupStats(items)
  const totalProfit = getGroupTotalProfit(items)
  return {
    items,
    count: items.length,
    averageCost: groupStats.averageCost,
    hasValidPrices: groupStats.hasValidPrices,
    totalProfit
  }
}

// --------------------------------------------------------------------------
// Lifecycle
// --------------------------------------------------------------------------

onMounted(async () => {
  if (platformStore.isCurrentPlatformConfigured && !platformStore.needsDecryption) {
    await fetchInventory()
  }
})

watch(
  () => props.platform,
  async () => {
    if (platformStore.isCurrentPlatformConfigured && !platformStore.needsDecryption) {
      await fetchInventory()
    }
  }
)
</script>

<template>
  <div class="inventory-tab">
    <!-- 头部统计和操作 -->
    <div class="tab-header">
      <div class="stats">
        <div class="stat-item">
          <span class="stat-value">{{ stats.totalCount }}</span>
          <span class="stat-label">件物品</span>
        </div>
        <div class="stat-item">
          <span class="stat-value value">{{ formatPriceDisplay(stats.totalValue) }}</span>
          <span class="stat-label">总价值</span>
        </div>
        <div class="stat-item">
          <span class="stat-value cost">{{ formatPriceDisplay(stats.totalCost) }}</span>
          <span class="stat-label">总成本</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" :class="stats.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'">
            {{ stats.totalProfit >= 0 ? '+' : '' }}¥{{ stats.totalProfit.toFixed(2) }}
          </span>
          <span class="stat-label">总利润</span>
        </div>
      </div>

      <div class="actions">
        <button
          type="button"
          class="toggle-btn"
          @click="handleToggleDisplayMode"
          :disabled="displayItems.length === 0"
        >
          {{ displayMode === 'expanded' ? '合并相同物品' : '展开全部' }}
        </button>
        <button
          type="button"
          class="refresh-btn"
          :disabled="loading || refreshing"
          @click="handleRefresh"
        >
          <span v-if="loading || refreshing" class="loading-spinner-inline"></span>
          <span v-else class="refresh-icon">&#x21bb;</span>
          <span>{{ loading || refreshing ? '加载中' : '刷新' }}</span>
        </button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="isBatchMode" class="batch-bar">
      <div class="batch-info">
        <span class="batch-count">已选择 {{ selectedIds.size }} 件</span>
        <button type="button" class="batch-clear" @click="clearSelection">
          取消选择
        </button>
      </div>
      <div class="batch-actions">
        <button type="button" class="batch-btn">批量设置成本</button>
        <button type="button" class="batch-btn primary">批量上架</button>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-state">
      <span class="error-icon">&#x26A0;</span>
      <span class="error-text">{{ error }}</span>
      <button type="button" class="retry-btn" @click="handleRefresh">重试</button>
    </div>

    <!-- 加载状态 -->
    <LoadingSpinner
      v-else-if="loading && displayItems.length === 0"
      size="large"
      text="正在加载库存数据..."
    />

    <!-- 空状态 -->
    <div v-else-if="displayItems.length === 0" class="empty-state">
      <div class="empty-icon">&#x1F4E6;</div>
      <p class="empty-title">暂无库存数据</p>
      <p class="empty-desc">点击刷新按钮获取最新库存</p>
      <button type="button" class="refresh-btn primary" @click="handleRefresh">
        <span class="refresh-icon">&#x21bb;</span>
        获取库存
      </button>
    </div>

    <!-- 库存网格 - 展开模式 -->
    <ItemGrid
      v-else-if="displayMode === 'expanded'"
      :items="itemsAsBaseItems"
      display-mode="expanded"
      :loading="refreshing"
      @refresh="handleRefresh"
    >
      <template #default="{ items }">
        <ItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :platform="platform"
          :usd-cny="usdCnyRate"
          :is-editing="isEditing(item.id)"
          :edit-value="editValue"
          show-cost-editor
          show-profit
          show-status
          show-stickers
          show-actions
          @edit-cost="handleEditCost"
          @save-cost="handleSaveCost"
          @cancel-edit="handleCancelEdit"
          @add-task="handleAddTask"
          @update:editValue="editValue = String($event)"
        />
      </template>
    </ItemGrid>

    <!-- 库存网格 - 分组模式 -->
    <ItemGrid
      v-else
      :items="itemsAsBaseItems"
      display-mode="grouped"
      :loading="refreshing"
      @refresh="handleRefresh"
    >
      <template #default>
        <GroupCard
          v-for="item in displayItems"
          :key="item.marketHashName"
          :group-name="item.marketHashName"
          :items="getGroupItems(item.marketHashName) as BaseItem[]"
          :expanded="isGroupExpanded(item.marketHashName)"
          @toggle="handleToggleGroup(item.marketHashName)"
        >
          <!-- 预览卡片 -->
          <template #preview="{ count }">
            <ItemCard
              :item="item as unknown as BaseItem"
              :platform="platform"
              :usd-cny="usdCnyRate"
              :show-count="count"
              :show-actions="true"
              show-cost-editor
              show-profit
              show-status
              show-stickers
              @edit-cost="handleEditCost"
              @save-cost="handleSaveCost"
              @cancel-edit="handleCancelEdit"
              @add-task="handleAddTask"
            />
          </template>

          <!-- 展开的物品列表 -->
          <template #expanded="{ items }">
            <div class="expanded-items-list">
              <ItemCard
                v-for="groupItem in items"
                :key="groupItem.id"
                :item="groupItem"
                :platform="platform"
                :usd-cny="usdCnyRate"
                :is-editing="isEditing(groupItem.id)"
                :edit-value="editValue"
                show-cost-editor
                show-profit
                show-status
                show-stickers
                show-actions
                @edit-cost="handleEditCost"
                @save-cost="handleSaveCost"
                @cancel-edit="handleCancelEdit"
                @add-task="handleAddTask"
                @update:editValue="editValue = String($event)"
              />
            </div>
          </template>
        </GroupCard>
      </template>
    </ItemGrid>

    <!-- 加载更多提示 -->
    <div v-if="(loading || refreshing) && displayItems.length > 0" class="loading-more">
      <div class="loading-spinner-small"></div>
      <span>正在更新...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 颜色变量
$primary-color: #6e72e5;
$primary-light: #eef0ff;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$text-muted: #9ca3af;
$border-color: #e6e8f0;
$background-light: #f9fafb;
$success-color: #22c55e;
$danger-color: #ef4444;
$warning-color: #f59e0b;

.inventory-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 12px;
}

// ========== 头部区域 ==========
.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
}

.stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: $primary-color;

    &.value {
      color: $primary-color;
    }

    &.cost {
      color: $warning-color;
    }
  }

  .stat-label {
    font-size: 14px;
    color: $text-secondary;
  }
}

.profit-positive {
  color: $success-color !important;
}

.profit-negative {
  color: $danger-color !important;
}

.actions {
  display: flex;
  gap: 10px;
}

.toggle-btn {
  padding: 10px 16px;
  background: $background-light;
  border: 1px solid $border-color;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: $primary-light;
  border: 1px solid rgba($primary-color, 0.2);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: $primary-color;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba($primary-color, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: $primary-color;
    color: #ffffff;
    border-color: $primary-color;

    &:hover:not(:disabled) {
      background: #5a5eca;
    }
  }

  .refresh-icon {
    font-size: 16px;
  }
}

.loading-spinner-inline {
  width: 16px;
  height: 16px;
  border: 2px solid rgba($primary-color, 0.2);
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// ========== 批量操作栏 ==========
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba($primary-color, 0.08);
  border-radius: 10px;
  border: 1px solid rgba($primary-color, 0.2);
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .batch-count {
    font-size: 14px;
    font-weight: 500;
    color: $primary-color;
  }

  .batch-clear {
    padding: 4px 10px;
    background: transparent;
    border: none;
    font-size: 13px;
    color: $text-secondary;
    cursor: pointer;

    &:hover {
      color: $text-primary;
    }
  }
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-btn {
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: $background-light;
  }

  &.primary {
    background: $primary-color;
    border-color: $primary-color;
    color: #ffffff;

    &:hover {
      background: #5a5eca;
    }
  }
}

// ========== 状态区域 ==========
.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid $border-color;
  gap: 12px;
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  opacity: 0.6;
}

.empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.empty-desc {
  margin: 0;
  font-size: 14px;
  color: $text-secondary;
}

.error-state {
  background: #fef2f2;
  border-color: #fecaca;

  .error-icon {
    font-size: 32px;
    color: $danger-color;
  }

  .error-text {
    font-size: 15px;
    color: $danger-color;
  }

  .retry-btn {
    margin-top: 8px;
    padding: 8px 20px;
    background: $danger-color;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #dc2626;
    }
  }
}

// ========== 展开物品列表 ==========
.expanded-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ========== 加载更多 ==========
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  font-size: 13px;
  color: $text-secondary;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba($primary-color, 0.2);
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ========== 响应式 ==========
@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .stats {
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px;
  }

  .actions {
    justify-content: stretch;

    .toggle-btn,
    .refresh-btn {
      flex: 1;
      justify-content: center;
    }
  }
}
</style>