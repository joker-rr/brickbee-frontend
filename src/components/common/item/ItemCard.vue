<script setup lang="ts">
/**
 * 物品卡片组件
 *
 * 展示物品的详细信息，包括：
 * - 物品图片
 * - 物品名称、稀有度、类别、外观
 * - 贴纸展示
 * - 状态标签
 * - 价格/成本/利润信息
 *
 * 参考 brickbee-frontend 的 InventoryItems/SellingItems 样式设计
 */

import { computed } from 'vue'
import type { BaseItem, ItemDetailInfo, StickerInfo, PlatformType, ItemRarityInfo, ItemSeoInfo } from './types'
import LoadingSpinner from './LoadingSpinner.vue'
import StatusBadge from './StatusBadge.vue'
import MetaTag from './MetaTag.vue'

// --------------------------------------------------------------------------
// Props
// --------------------------------------------------------------------------

interface Props {
  item: BaseItem
  platform?: PlatformType
  usdCny?: number
  showCount?: number // 显示数量（分组模式下）
  showCostEditor?: boolean
  showProfit?: boolean
  showStatus?: boolean
  showStickers?: boolean
  showActions?: boolean
  isEditing?: boolean
  editValue?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  platform: 'MARKET',
  showCount: 0,
  showCostEditor: true,
  showProfit: true,
  showStatus: true,
  showStickers: true,
  showActions: true,
  isEditing: false,
  editValue: ''
})

// --------------------------------------------------------------------------
// Emits
// --------------------------------------------------------------------------

const emit = defineEmits<{
  (e: 'edit-cost', item: BaseItem): void
  (e: 'save-cost', item: BaseItem, value: number): void
  (e: 'cancel-edit'): void
  (e: 'add-task', item: BaseItem): void
  (e: 'action', action: string, item: BaseItem): void
  (e: 'update:editValue', value: number | string): void
}>()

// --------------------------------------------------------------------------
// Computed - 物品信息解析
// --------------------------------------------------------------------------

const parsedDetail = computed<ItemDetailInfo | null>(() => {
  if (!props.item.detail) return null
  if (typeof props.item.detail === 'string') {
    try {
      return JSON.parse(props.item.detail) as ItemDetailInfo
    } catch {
      return null
    }
  }
  return props.item.detail as ItemDetailInfo
})

const itemImage = computed(() => {
  return parsedDetail.value?.image || props.item.imageUrl || props.item.image || ''
})

const itemName = computed(() => {
  return parsedDetail.value?.market_name ||
    props.item.name ||
    props.item.marketHashName ||
    props.item.market_hash_name ||
    ''
})

const itemRarity = computed(() => {
  const detail = parsedDetail.value
  if (!detail?.rarity) return ''
  if (typeof detail.rarity === 'string') return detail.rarity
  return detail.rarity.rarity_zh || detail.rarity.rarity_name || ''
})

const itemCategory = computed(() => {
  const detail = parsedDetail.value
  return detail?.seo?.seo_category_zh || detail?.seo?.seo_category || ''
})

const itemExterior = computed(() => {
  const detail = parsedDetail.value
  return detail?.exterior_zh || detail?.seo?.exterior_zh || detail?.exterior || ''
})

const itemNameTag = computed(() => {
  return parsedDetail.value?.nameTag || ''
})

const itemStickers = computed<StickerInfo[]>(() => {
  return parsedDetail.value?.stickers || []
})

// --------------------------------------------------------------------------
// Computed - 平台配置
// --------------------------------------------------------------------------

const platformConfig = computed(() => {
  const configs: Record<string, { feeRate: number; hasUsdCny: boolean; deduction: number; symbol: string }> = {
    CSGOBUY: { feeRate: 0.99, hasUsdCny: false, deduction: 0, symbol: '¥' },
    MARKET: { feeRate: 0.95, hasUsdCny: true, deduction: 0.04, symbol: '$' }
  }
  return configs[props.platform] || configs.MARKET
})

// --------------------------------------------------------------------------
// Computed - 价格计算
// --------------------------------------------------------------------------

const marketPrice = computed(() => {
  return props.item.marketPrice ?? props.item.market_price ?? props.item.listPrice ?? props.item.price ?? 0
})

const costPrice = computed(() => {
  const cost = props.item.costPrice
  if (cost === undefined || cost === null || cost === '') return null
  return typeof cost === 'string' ? parseFloat(cost) : cost
})

const profit = computed(() => {
  if (costPrice.value === null || !marketPrice.value) return null

  const config = platformConfig.value
  let actualReceived: number

  if (config.hasUsdCny) {
    const rate = props.item.usdCny || props.usdCny || 7.18
    actualReceived = marketPrice.value * config.feeRate * (rate - config.deduction)
  } else {
    actualReceived = marketPrice.value * config.feeRate
  }

  return actualReceived - costPrice.value
})

const priceDisplay = computed(() => {
  if (!marketPrice.value) return '-'
  return `${platformConfig.value.symbol}${marketPrice.value.toFixed(2)}`
})

const costDisplay = computed(() => {
  if (costPrice.value === null) return '未设置'
  return `¥${costPrice.value.toFixed(2)}`
})

const profitDisplay = computed(() => {
  if (profit.value === null) return '无成本'
  return `${profit.value >= 0 ? '+' : ''}${profit.value.toFixed(2)}`
})

const profitClass = computed(() => {
  if (profit.value === null) return ''
  return profit.value >= 0 ? 'positive' : 'negative'
})

// --------------------------------------------------------------------------
// Computed - 状态
// --------------------------------------------------------------------------

const isLoading = computed(() => props.item.loading)

const tradableStatus = computed(() => {
  if (props.item.tradable === undefined) return null
  return props.item.tradable ? 'tradable' : 'non_tradable'
})

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

const handleEditCost = () => {
  emit('edit-cost', props.item)
}

const handleSaveCost = () => {
  const value = typeof props.editValue === 'string' ? parseFloat(props.editValue) : props.editValue
  if (!isNaN(value)) {
    emit('save-cost', props.item, value)
  }
}

const handleCancelEdit = () => {
  emit('cancel-edit')
}

const handleAddTask = () => {
  emit('add-task', props.item)
}

const handleAction = (action: string) => {
  emit('action', action, props.item)
}

const updateEditValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:editValue', target.value)
}
</script>

<template>
  <div class="item-card" :class="{ loading: isLoading }">
    <!-- 加载状态 -->
    <LoadingSpinner v-if="isLoading" />

    <template v-else>
      <!-- 物品图片 -->
      <div class="item-image-wrapper">
        <img
          v-if="itemImage"
          :src="itemImage"
          :alt="itemName"
          class="item-image"
          loading="lazy"
        />
        <div v-else class="item-image placeholder">
          <span>&#x1F3AE;</span>
        </div>
        <!-- 数量标识 -->
        <div v-if="showCount > 1" class="item-count-badge">
          ×{{ showCount }}
        </div>
      </div>

      <!-- 物品信息 -->
      <div class="item-info">
        <!-- 标题行 -->
        <div class="item-header">
          <div class="item-name" :title="itemName">{{ itemName }}</div>
          <div v-if="marketPrice" class="item-price">
            {{ priceDisplay }}
          </div>
        </div>

        <!-- 属性标签 -->
        <div class="item-meta">
          <MetaTag v-if="itemRarity" type="rarity">{{ itemRarity }}</MetaTag>
          <MetaTag v-if="itemCategory" type="category">{{ itemCategory }}</MetaTag>
          <MetaTag v-if="itemExterior" type="exterior">{{ itemExterior }}</MetaTag>
          <MetaTag v-if="itemNameTag" type="nametag">{{ itemNameTag }}</MetaTag>
        </div>

        <!-- 状态和贴纸 -->
        <div v-if="showStatus || showStickers" class="stickers-section">
          <div v-if="showStatus" class="item-status">
            <StatusBadge v-if="tradableStatus" :status="tradableStatus" />
            <StatusBadge v-else-if="item.status" :status="item.status" />
            <span v-if="item.cooldown" class="cooldown-info">
              冷却时间: {{ item.cooldown }}
            </span>
          </div>
          <div v-if="showStickers && itemStickers.length > 0" class="stickers-list">
            <span
              v-for="(sticker, idx) in itemStickers"
              :key="idx"
              class="sticker-item"
            >
              <img
                :src="sticker.image"
                :title="sticker.name"
                class="sticker-image"
                loading="lazy"
              />
            </span>
          </div>
        </div>

        <!-- 控制区域 -->
        <div class="task-controls">
          <!-- 利润显示 -->
          <div v-if="showProfit" class="control-group">
            <label class="control-label">预估利润</label>
            <span class="profit-display" :class="profitClass">
              {{ profitDisplay }}
            </span>
          </div>

          <!-- 成本价 -->
          <div v-if="showCostEditor" class="control-group">
            <label class="control-label">成本价</label>
            <template v-if="isEditing">
              <div class="edit-cost">
                <input
                  type="number"
                  :value="editValue"
                  step="0.01"
                  min="0"
                  placeholder="¥0.00"
                  class="cost-input"
                  @input="updateEditValue"
                  @keyup.enter="handleSaveCost"
                  @keyup.escape="handleCancelEdit"
                />
                <button type="button" class="btn-icon save" @click="handleSaveCost">
                  &#x2714;
                </button>
                <button type="button" class="btn-icon cancel" @click="handleCancelEdit">
                  &#x2718;
                </button>
              </div>
            </template>
            <template v-else>
              <span
                class="cost-value"
                :class="{ empty: costPrice === null }"
                @dblclick="handleEditCost"
              >
                {{ costDisplay }}
              </span>
            </template>
          </div>

          <!-- 汇率显示 -->
          <div v-if="platformConfig.hasUsdCny && usdCny" class="control-group">
            <label class="control-label">当前汇率</label>
            <span class="usd-rate">{{ usdCny }}</span>
          </div>

          <!-- 操作按钮 -->
          <div v-if="showActions" class="action-buttons">
            <button type="button" class="task-btn" @click="handleAddTask">
              <span class="btn-icon-text">&#x1F4CB;</span>
              添加任务
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.item-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border-color: #cbd5e1;
  }

  &.loading {
    min-height: 120px;
    justify-content: center;
    align-items: center;
  }
}

.item-image-wrapper {
  position: relative;
  margin-right: 16px;
  flex-shrink: 0;

  .item-image {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease;
    background: #f8fafc;

    &:hover {
      transform: scale(1.05);
    }

    &.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #9ca3af;
    }
  }

  .item-count-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .item-name {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .item-price {
    font-size: 13px;
    font-weight: 500;
    color: #059669;
    background-color: #d1fae5;
    border-radius: 4px;
    padding: 2px 10px;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stickers-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  .item-status {
    display: flex;
    align-items: center;
    gap: 8px;

    .cooldown-info {
      font-size: 11px;
      color: #64748b;
    }
  }

  .stickers-list {
    display: flex;
    gap: 4px;
  }

  .sticker-item {
    .sticker-image {
      width: 28px;
      height: 20px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

.task-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  margin-top: 4px;

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;

    .control-label {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
    }
  }

  .profit-display {
    font-size: 13px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;

    &.positive {
      color: #dc2626;
      background: #fee2e2;
    }

    &.negative {
      color: #059669;
      background: #d1fae5;
    }
  }

  .cost-value {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f3f4f6;
    }

    &.empty {
      color: #9ca3af;
      font-style: italic;
    }
  }

  .edit-cost {
    display: flex;
    align-items: center;
    gap: 4px;

    .cost-input {
      width: 80px;
      padding: 6px 8px;
      border: 1px solid #3b82f6;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
    }

    .btn-icon {
      padding: 6px 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;

      &.save {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;

        &:hover {
          background: rgba(34, 197, 94, 0.2);
        }
      }

      &.cancel {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;

        &:hover {
          background: rgba(239, 68, 68, 0.2);
        }
      }
    }
  }

  .usd-rate {
    font-size: 13px;
    font-weight: 550;
    color: rgb(0, 60, 255);
  }

  .action-buttons {
    margin-left: auto;
  }

  .task-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      transform: translateY(-1px);
    }

    .btn-icon-text {
      font-size: 12px;
    }
  }
}

// 响应式
@media (max-width: 640px) {
  .item-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .item-image-wrapper {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .item-header {
    flex-direction: column;
    gap: 6px;
  }

  .task-controls {
    flex-direction: column;
    align-items: stretch;

    .action-buttons {
      margin-left: 0;
      margin-top: 8px;
    }

    .task-btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>