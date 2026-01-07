<script setup lang="ts">
/**
 * 物品分组卡片组件
 *
 * 展示同一类型物品的分组，支持展开/收起
 */

import { computed, ref } from 'vue'
import type { InventoryItem, GroupStats } from '@/types/inventory'
import ItemCard from './ItemCard.vue'

// Props
const props = defineProps<{
  groupName: string
  items: InventoryItem[]
  expanded?: boolean
  groupStats?: GroupStats
  showCost?: boolean
  profit?: number | null
  currencySymbol?: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'cost-change', items: InventoryItem[], value: number): void
  (e: 'item-select', item: InventoryItem): void
}>()

// 本地状态
const costInputValue = ref<string>('')
const isEditingCost = ref(false)

// Computed
const itemCount = computed(() => props.items.length)

const previewItem = computed(() => props.items[0])

const displayName = computed(() => {
  return previewItem.value?.detail?.marketName || props.groupName
})

const imageUrl = computed(() => {
  return previewItem.value?.detail?.image || previewItem.value?.imageUrl
})

const priceDisplay = computed(() => {
  const price = previewItem.value?.marketPrice
  if (!price) return '-'
  const symbol = props.currencySymbol || '¥'
  return `${symbol}${price.toFixed(2)}`
})

const averageCostDisplay = computed(() => {
  if (!props.groupStats?.hasValidPrices) return '未设置'
  return `¥${props.groupStats.averageCost?.toFixed(2)}`
})

const profitClass = computed(() => {
  if (props.profit === null || props.profit === undefined) return ''
  return props.profit >= 0 ? 'profit-positive' : 'profit-negative'
})

const profitDisplay = computed(() => {
  if (props.profit === null || props.profit === undefined) return '未设置成本'
  return props.profit >= 0 ? `+¥${props.profit.toFixed(2)}` : `¥${props.profit.toFixed(2)}`
})

// Methods
function handleToggle(): void {
  emit('toggle')
}

function startEditCost(): void {
  costInputValue.value = props.groupStats?.averageCost?.toString() || ''
  isEditingCost.value = true
}

function cancelEditCost(): void {
  isEditingCost.value = false
  costInputValue.value = ''
}

function confirmCostChange(): void {
  const value = parseFloat(costInputValue.value)
  if (!isNaN(value) && value >= 0) {
    emit('cost-change', props.items, value)
  }
  cancelEditCost()
}

function handleItemSelect(item: InventoryItem): void {
  emit('item-select', item)
}
</script>

<template>
  <div class="item-card-group" :class="{ expanded }">
    <!-- 分组头部 -->
    <div class="group-header" @click="handleToggle">
      <div class="group-preview">
        <!-- 预览图片 -->
        <div class="preview-image-wrapper">
          <img v-if="imageUrl" :src="imageUrl" :alt="displayName" class="preview-image" />
          <div class="item-count-badge">×{{ itemCount }}</div>
        </div>

        <!-- 分组信息 -->
        <div class="group-info">
          <div class="group-name" :title="displayName">{{ displayName }}</div>

          <div class="group-price-row">
            <span class="group-price">{{ priceDisplay }}</span>
            <span v-if="profit !== undefined" class="group-profit" :class="profitClass">
              {{ profitDisplay }}
            </span>
          </div>

          <!-- 属性标签 -->
          <div v-if="previewItem?.detail" class="group-tags">
            <span v-if="previewItem.detail.rarity.rarityZh" class="tag tag-rarity">
              {{ previewItem.detail.rarity.rarityZh }}
            </span>
            <span v-if="previewItem.detail.seo.seoCategoryZh" class="tag tag-category">
              {{ previewItem.detail.seo.seoCategoryZh }}
            </span>
          </div>
        </div>
      </div>

      <!-- 成本价区域 -->
      <div v-if="showCost" class="group-cost" @click.stop>
        <template v-if="!isEditingCost">
          <div class="cost-display">
            <span class="cost-label">
              <span v-if="groupStats?.count && groupStats.count < itemCount" class="cost-count">
                {{ groupStats.count }}件
              </span>
              <span v-else class="cost-count">全部</span>
              平均成本
            </span>
            <span class="cost-value" @dblclick="startEditCost">{{ averageCostDisplay }}</span>
          </div>
          <button class="edit-btn" @click="startEditCost">编辑</button>
        </template>
        <template v-else>
          <input
            v-model="costInputValue"
            type="number"
            class="cost-input"
            placeholder="¥0.00"
            @keyup.enter="confirmCostChange"
          />
          <button class="save-btn" @click="confirmCostChange">保存</button>
          <button class="cancel-btn" @click="cancelEditCost">取消</button>
        </template>
      </div>

      <!-- 展开按钮 -->
      <button class="toggle-btn" :class="{ 'is-expanded': expanded }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z" />
        </svg>
        {{ expanded ? '收起' : '展开' }}
      </button>
    </div>

    <!-- 展开内容 -->
    <div v-if="expanded" class="group-content">
      <div class="items-grid">
        <ItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :show-cost="showCost"
          :currency-symbol="currencySymbol"
          @select="handleItemSelect"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #6e72e5;
$primary-light: #eef0ff;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #e6e8f0;
$success-color: #22c55e;
$danger-color: #ef4444;

.item-card-group {
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.expanded {
    .toggle-btn svg {
      transform: rotate(180deg);
    }
  }
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
  }
}

.group-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.preview-image-wrapper {
  position: relative;
  flex-shrink: 0;

  .preview-image {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .item-count-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    padding: 2px 6px;
    background: linear-gradient(135deg, $primary-color, #4f46e5);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

.group-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-price-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-price {
  font-size: 15px;
  font-weight: 600;
  color: $success-color;
}

.group-profit {
  font-size: 13px;
  font-weight: 500;

  &.profit-positive {
    color: $success-color;
  }

  &.profit-negative {
    color: $danger-color;
  }
}

.group-tags {
  display: flex;
  gap: 4px;
}

.tag {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;

  &.tag-rarity {
    background: #fef3c7;
    color: #92400e;
  }

  &.tag-category {
    background: #dbeafe;
    color: #1e40af;
  }
}

.group-cost {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.cost-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cost-label {
  font-size: 11px;
  color: $text-secondary;

  .cost-count {
    color: $primary-color;
    font-weight: 600;
  }
}

.cost-value {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.cost-input {
  width: 80px;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid $border-color;
  border-radius: 4px;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.edit-btn,
.save-btn,
.cancel-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #f1f5f9;
  color: $text-secondary;

  &:hover {
    background: #e2e8f0;
  }
}

.save-btn {
  background: $primary-color;
  color: #fff;

  &:hover {
    background: darken($primary-color, 8%);
  }
}

.cancel-btn {
  background: #f1f5f9;
  color: $text-secondary;

  &:hover {
    background: #e2e8f0;
  }
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #f1f5f9;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    transition: transform 0.2s;
  }

  &:hover {
    background: #e2e8f0;
  }

  &.is-expanded {
    background: $primary-light;
    border-color: $primary-color;
    color: $primary-color;
  }
}

.group-content {
  padding: 12px;
  background: #f8fafc;
  max-height: 400px;
  overflow-y: auto;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
</style>
