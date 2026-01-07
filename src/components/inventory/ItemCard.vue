<script setup lang="ts">
/**
 * 物品卡片组件
 *
 * 展示单个库存物品的详细信息
 */

import { computed } from 'vue'
import type { InventoryItem } from '@/types/inventory'

// Props
const props = defineProps<{
  item: InventoryItem
  showCost?: boolean
  showProfit?: boolean
  profit?: number | null
  selectable?: boolean
  selected?: boolean
  currencySymbol?: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'select', item: InventoryItem): void
  (e: 'cost-change', item: InventoryItem, value: number): void
  (e: 'action', item: InventoryItem, action: string): void
}>()

// Computed
const displayName = computed(() => {
  return props.item.detail?.marketName || props.item.name || props.item.marketHashName
})

const imageUrl = computed(() => {
  return props.item.detail?.image || props.item.imageUrl
})

const priceDisplay = computed(() => {
  if (!props.item.marketPrice) return '-'
  const symbol = props.currencySymbol || '¥'
  return `${symbol}${props.item.marketPrice.toFixed(2)}`
})

const profitClass = computed(() => {
  if (props.profit === null || props.profit === undefined) return ''
  return props.profit >= 0 ? 'profit-positive' : 'profit-negative'
})

const profitDisplay = computed(() => {
  if (props.profit === null || props.profit === undefined) return '未设置成本'
  return props.profit >= 0 ? `+¥${props.profit.toFixed(2)}` : `¥${props.profit.toFixed(2)}`
})

const tradableClass = computed(() => {
  return props.item.tradable ? 'status-tradable' : 'status-locked'
})

const tradableText = computed(() => {
  return props.item.tradable ? '可交易' : '不可交易'
})

// Methods
function handleSelect(): void {
  if (props.selectable) {
    emit('select', props.item)
  }
}

function handleCostInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  if (!isNaN(value) && value >= 0) {
    emit('cost-change', props.item, value)
  }
}
</script>

<template>
  <div
    class="item-card"
    :class="{ 'item-selected': selected, 'item-loading': item.loading }"
    @click="handleSelect"
  >
    <!-- 加载状态 -->
    <div v-if="item.loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 选择框 -->
    <div v-if="selectable" class="select-checkbox">
      <input type="checkbox" :checked="selected" @click.stop />
    </div>

    <!-- 物品图片 -->
    <div class="item-image-wrapper">
      <img v-if="imageUrl" :src="imageUrl" :alt="displayName" class="item-image" loading="lazy" />
      <div v-else class="image-placeholder"></div>
    </div>

    <!-- 物品信息 -->
    <div class="item-info">
      <div class="item-name" :title="displayName">{{ displayName }}</div>

      <!-- 价格和利润 -->
      <div class="item-price-row">
        <span class="item-price">{{ priceDisplay }}</span>
        <span v-if="showProfit" class="item-profit" :class="profitClass">
          {{ profitDisplay }}
        </span>
      </div>

      <!-- 属性标签 -->
      <div v-if="item.detail" class="item-tags">
        <span v-if="item.detail.rarity.rarityZh" class="tag tag-rarity">
          {{ item.detail.rarity.rarityZh }}
        </span>
        <span v-if="item.detail.seo.seoCategoryZh" class="tag tag-category">
          {{ item.detail.seo.seoCategoryZh }}
        </span>
        <span v-if="item.detail.exterior" class="tag tag-exterior">
          {{ item.detail.seo.exteriorZh || item.detail.exterior }}
        </span>
      </div>

      <!-- 贴纸 -->
      <div v-if="item.detail?.stickers?.length" class="item-stickers">
        <img
          v-for="(sticker, idx) in item.detail.stickers"
          :key="idx"
          :src="sticker.image"
          :title="sticker.name"
          class="sticker-image"
        />
      </div>

      <!-- 状态和操作 -->
      <div class="item-footer">
        <span class="item-status" :class="tradableClass">{{ tradableText }}</span>

        <!-- 成本价输入 -->
        <div v-if="showCost" class="cost-input-wrapper">
          <label class="cost-label">成本价</label>
          <input
            type="number"
            class="cost-input"
            :value="item.costPrice"
            placeholder="¥0.00"
            @blur="handleCostInput"
            @keyup.enter="($event.target as HTMLInputElement).blur()"
            @click.stop
          />
        </div>
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

.item-card {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: $primary-color;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.item-selected {
    border-color: $primary-color;
    background: $primary-light;
  }

  &.item-loading {
    opacity: 0.7;
    pointer-events: none;
  }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  z-index: 10;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba($primary-color, 0.2);
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 8px;
  font-size: 12px;
  color: $text-secondary;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.select-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.item-image-wrapper {
  flex-shrink: 0;
  width: 80px;
  height: 80px;

  .item-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 6px;
    background: #f8fafc;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 6px;
  }
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-price-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-price {
  font-size: 15px;
  font-weight: 600;
  color: $success-color;
}

.item-profit {
  font-size: 13px;
  font-weight: 500;

  &.profit-positive {
    color: $success-color;
  }

  &.profit-negative {
    color: $danger-color;
  }
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 6px;
  font-size: 11px;
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

  &.tag-exterior {
    background: #f3e8ff;
    color: #7c3aed;
  }
}

.item-stickers {
  display: flex;
  gap: 4px;

  .sticker-image {
    width: 24px;
    height: 18px;
    object-fit: contain;
    border-radius: 2px;
    border: 1px solid $border-color;
  }
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.item-status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;

  &.status-tradable {
    background: rgba($success-color, 0.1);
    color: $success-color;
  }

  &.status-locked {
    background: rgba($danger-color, 0.1);
    color: $danger-color;
  }
}

.cost-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;

  .cost-label {
    font-size: 12px;
    color: $text-secondary;
  }

  .cost-input {
    width: 70px;
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid $border-color;
    border-radius: 4px;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: $primary-color;
    }
  }
}
</style>
