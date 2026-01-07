<script setup lang="ts">
/**
 * 库存网格组件
 *
 * 展示库存物品列表，支持分组/展开模式
 */

import { computed } from 'vue'
import type { InventoryItem, GroupedItems, DisplayMode, GroupStats } from '@/types/inventory'
import ItemCard from './ItemCard.vue'
import ItemCardGroup from './ItemCardGroup.vue'

// Props
const props = defineProps<{
  items: InventoryItem[]
  groupedItems: GroupedItems
  displayMode: DisplayMode
  expandedGroups: Set<string>
  groupStats?: Record<string, GroupStats>
  groupProfits?: Record<string, number | null>
  showCost?: boolean
  currencySymbol?: string
  selectable?: boolean
  selectedIds?: Set<string>
}>()

// Emits
const emit = defineEmits<{
  (e: 'toggle-group', groupName: string): void
  (e: 'item-select', item: InventoryItem): void
  (e: 'cost-change', item: InventoryItem, value: number): void
  (e: 'group-cost-change', items: InventoryItem[], value: number): void
  (e: 'item-ref', el: HTMLElement | null, item: InventoryItem): void
}>()

// Computed
const groupNames = computed(() => Object.keys(props.groupedItems))

const isGroupMode = computed(() => props.displayMode === 'grouped')

// Methods
function handleToggleGroup(groupName: string): void {
  emit('toggle-group', groupName)
}

function handleItemSelect(item: InventoryItem): void {
  emit('item-select', item)
}

function handleCostChange(item: InventoryItem, value: number): void {
  emit('cost-change', item, value)
}

function handleGroupCostChange(items: InventoryItem[], value: number): void {
  emit('group-cost-change', items, value)
}

function isGroupExpanded(groupName: string): boolean {
  return props.expandedGroups.has(groupName)
}

function isItemSelected(itemId: string): boolean {
  return props.selectedIds?.has(itemId) || false
}

function getGroupProfit(groupName: string): number | null {
  return props.groupProfits?.[groupName] ?? null
}

function getGroupStats(groupName: string): GroupStats | undefined {
  return props.groupStats?.[groupName]
}

function setItemRef(el: HTMLElement | null, item: InventoryItem): void {
  emit('item-ref', el, item)
}
</script>

<template>
  <div class="inventory-grid">
    <!-- 分组模式 -->
    <template v-if="isGroupMode">
      <ItemCardGroup
        v-for="groupName in groupNames"
        :key="groupName"
        :group-name="groupName"
        :items="groupedItems[groupName]"
        :expanded="isGroupExpanded(groupName)"
        :group-stats="getGroupStats(groupName)"
        :show-cost="showCost"
        :profit="getGroupProfit(groupName)"
        :currency-symbol="currencySymbol"
        @toggle="handleToggleGroup(groupName)"
        @cost-change="handleGroupCostChange"
        @item-select="handleItemSelect"
      />
    </template>

    <!-- 展开模式 -->
    <template v-else>
      <div class="items-container">
        <div
          v-for="item in items"
          :key="item.id"
          :ref="(el) => setItemRef(el as HTMLElement | null, item)"
          class="item-wrapper"
        >
          <ItemCard
            :item="item"
            :show-cost="showCost"
            :show-profit="true"
            :selectable="selectable"
            :selected="isItemSelected(item.id)"
            :currency-symbol="currencySymbol"
            @select="handleItemSelect"
            @cost-change="handleCostChange"
          />
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <div v-if="items.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <p class="empty-text">暂无库存物品</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$border-color: #e6e8f0;
$text-secondary: #6b7280;

.inventory-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 12px;
}

.item-wrapper {
  min-width: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 12px;
  color: $text-secondary;

  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-text {
    margin: 0;
    font-size: 15px;
  }
}

@media (max-width: 768px) {
  .items-container {
    grid-template-columns: 1fr;
  }
}
</style>
