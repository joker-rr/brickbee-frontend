<script setup lang="ts">
/**
 * 在售 Tab 组件
 *
 * 显示指定平台的在售物品，支持：
 * - 自动加载/刷新在售列表
 * - 改价/下架操作
 * - 批量操作
 * - 卡片式网格布局 (参考 brickbee-frontend SellingItems 样式)
 */

import { ref, computed, onMounted, watch } from 'vue'
import { usePlatformStore } from '@/stores/modules/platform'
import { useSellingStore } from '@/stores/modules/selling'
import { usePlatformAdapter } from '@/composables/platform/usePlatformAdapter'
import type { PlatformType } from '@/config/platform.config'
import type { SellingItem } from '@/types/selling'

// 公共组件
import {
  ItemGrid,
  LoadingSpinner,
  StatusBadge
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
const sellingStore = useSellingStore()
const { getCurrencySymbol } = usePlatformAdapter()

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------

const changePriceModalVisible = ref(false)
const changePriceItem = ref<SellingItem | null>(null)
const newPrice = ref<number>(0)

// --------------------------------------------------------------------------
// Computed
// --------------------------------------------------------------------------

const loading = computed(() => sellingStore.loading)
const refreshing = computed(() => sellingStore.refreshing)
const error = computed(() => sellingStore.error)
const displayMode = computed(() => sellingStore.displayMode)
const displayItems = computed(() => sellingStore.displayItems)
const stats = computed(() => sellingStore.stats)
const isBatchMode = computed(() => sellingStore.isBatchMode)
const selectedIds = computed(() => sellingStore.selectedIds)

const currencySymbol = computed(() => getCurrencySymbol())

// --------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------

const handleRefresh = async () => {
  await sellingStore.refreshSellingItems()
}

const handleToggleDisplayMode = () => {
  sellingStore.toggleDisplayMode()
}

const handleSelectItem = (itemId: string) => {
  sellingStore.selectItem(itemId)
}

const isSelected = (itemId: string): boolean => {
  return sellingStore.isSelected(itemId)
}

const isOperating = (assetId: string): boolean => {
  return sellingStore.isOperating(assetId)
}

const openChangePriceModal = (item: SellingItem) => {
  changePriceItem.value = item
  newPrice.value = item.listPrice
  changePriceModalVisible.value = true
}

const closeChangePriceModal = () => {
  changePriceModalVisible.value = false
  changePriceItem.value = null
  newPrice.value = 0
}

const handleChangePrice = async () => {
  if (!changePriceItem.value || newPrice.value <= 0) return

  const success = await sellingStore.changePrice({
    assetId: changePriceItem.value.assetId,
    newPrice: newPrice.value
  })

  if (success) {
    closeChangePriceModal()
  }
}

const handleDelist = async (item: SellingItem) => {
  if (confirm(`确定要下架 "${item.name}" 吗？`)) {
    await sellingStore.delistItem({ assetId: item.assetId })
  }
}

const handleBatchDelist = async () => {
  const selectedItems = sellingStore.selectedItems
  if (selectedItems.length === 0) return

  if (confirm(`确定要下架选中的 ${selectedItems.length} 件物品吗？`)) {
    await sellingStore.batchDelist({
      assetIds: selectedItems.map(item => item.assetId)
    })
  }
}

const formatPrice = (price: number): string => {
  return `${currencySymbol.value}${price.toFixed(2)}`
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// --------------------------------------------------------------------------
// Lifecycle
// --------------------------------------------------------------------------

onMounted(async () => {
  if (platformStore.isCurrentPlatformConfigured && !platformStore.needsDecryption) {
    await sellingStore.fetchSellingItems()
  }
})

watch(
  () => props.platform,
  async () => {
    if (platformStore.isCurrentPlatformConfigured && !platformStore.needsDecryption) {
      await sellingStore.fetchSellingItems()
    }
  }
)
</script>

<template>
  <div class="selling-tab">
    <!-- 头部统计和操作 -->
    <div class="tab-header">
      <div class="stats">
        <div class="stat-item">
          <span class="stat-value">{{ stats.totalCount }}</span>
          <span class="stat-label">件在售</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatPrice(stats.totalValue) }}</span>
          <span class="stat-label">总售价</span>
        </div>
        <div class="stat-item">
          <span class="stat-value active">{{ stats.activeCount }}</span>
          <span class="stat-label">活跃</span>
        </div>
        <div class="stat-item">
          <span class="stat-value pending">{{ stats.pendingCount }}</span>
          <span class="stat-label">处理中</span>
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
          <span>刷新</span>
        </button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="isBatchMode" class="batch-bar">
      <div class="batch-info">
        <span class="batch-count">已选择 {{ selectedIds.size }} 件</span>
        <button type="button" class="batch-clear" @click="sellingStore.clearSelection">
          取消选择
        </button>
      </div>
      <div class="batch-actions">
        <button type="button" class="batch-btn danger" @click="handleBatchDelist">
          批量下架
        </button>
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
      text="正在加载在售数据..."
    />

    <!-- 空状态 -->
    <div v-else-if="displayItems.length === 0" class="empty-state">
      <span class="empty-icon">&#x1F3F7;</span>
      <p class="empty-title">暂无在售商品</p>
      <p class="empty-desc">前往库存页面上架物品</p>
    </div>

    <!-- 在售物品网格 -->
    <ItemGrid
      v-else
      :items="displayItems"
      display-mode="expanded"
      :loading="refreshing"
      @refresh="handleRefresh"
    >
      <template #default>
        <div
          v-for="item in displayItems"
          :key="item.id"
          class="selling-card"
          :class="{ selected: isSelected(item.id), operating: isOperating(item.assetId) }"
        >
          <!-- 选择框 -->
          <div class="card-checkbox">
            <input
              type="checkbox"
              :checked="isSelected(item.id)"
              @change="handleSelectItem(item.id)"
            />
          </div>

          <!-- 物品卡片主体 -->
          <div class="card-content">
            <!-- 物品图片 -->
            <div class="item-image-wrapper">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                class="item-image"
                loading="lazy"
              />
              <div v-else class="item-image placeholder">
                <span>&#x1F3AE;</span>
              </div>
            </div>

            <!-- 物品信息 -->
            <div class="item-info">
              <div class="item-header">
                <div class="item-name" :title="item.marketHashName">
                  {{ item.name || item.marketHashName }}
                </div>
                <div class="item-price">
                  {{ formatPrice(item.listPrice) }}
                </div>
              </div>

              <div class="item-meta">
                <StatusBadge :status="item.status" />
                <span class="listed-time">{{ formatDate(item.listedAt) }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <button
                type="button"
                class="action-btn primary"
                :disabled="isOperating(item.assetId)"
                @click="openChangePriceModal(item)"
              >
                改价
              </button>
              <button
                type="button"
                class="action-btn danger"
                :disabled="isOperating(item.assetId)"
                @click="handleDelist(item)"
              >
                下架
              </button>
            </div>
          </div>
        </div>
      </template>
    </ItemGrid>

    <!-- 加载更多提示 -->
    <div v-if="(loading || refreshing) && displayItems.length > 0" class="loading-more">
      <div class="loading-spinner-small"></div>
      <span>正在更新...</span>
    </div>

    <!-- 改价弹窗 -->
    <Teleport to="body">
      <div v-if="changePriceModalVisible" class="modal-overlay" @click.self="closeChangePriceModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>修改价格</h3>
            <button type="button" class="modal-close" @click="closeChangePriceModal">
              &#x2715;
            </button>
          </div>
          <div class="modal-body">
            <div v-if="changePriceItem" class="item-preview">
              <img
                v-if="changePriceItem.imageUrl"
                :src="changePriceItem.imageUrl"
                :alt="changePriceItem.name"
                class="preview-image"
              />
              <span class="preview-name">{{ changePriceItem.name }}</span>
            </div>
            <div class="price-input-group">
              <label>新价格</label>
              <div class="input-wrapper">
                <span class="currency-prefix">{{ currencySymbol }}</span>
                <input
                  v-model.number="newPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  class="price-input"
                  @keyup.enter="handleChangePrice"
                />
              </div>
              <span v-if="changePriceItem" class="original-price">
                原价: {{ formatPrice(changePriceItem.listPrice) }}
              </span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeChangePriceModal">
              取消
            </button>
            <button
              type="button"
              class="btn-confirm"
              :disabled="newPrice <= 0"
              @click="handleChangePrice"
            >
              确认修改
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
$warning-color: #f59e0b;
$danger-color: #ef4444;

.selling-tab {
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

    &.active {
      color: $success-color;
    }

    &.pending {
      color: $warning-color;
    }
  }

  .stat-label {
    font-size: 14px;
    color: $text-secondary;
  }
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

  &.danger {
    background: rgba($danger-color, 0.1);
    border-color: rgba($danger-color, 0.2);
    color: $danger-color;

    &:hover {
      background: rgba($danger-color, 0.15);
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
  font-size: 48px;
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

    &:hover {
      background: #dc2626;
    }
  }
}

// ========== 在售卡片 ==========
.selling-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
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

  &.selected {
    background: rgba($primary-color, 0.05);
    border-color: rgba($primary-color, 0.3);
  }

  &.operating {
    opacity: 0.6;
    pointer-events: none;
  }
}

.card-checkbox {
  padding-top: 4px;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.item-image-wrapper {
  flex-shrink: 0;

  .item-image {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: contain;
    background: #f8fafc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: $text-muted;
    }
  }
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .item-name {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-price {
    font-size: 14px;
    font-weight: 600;
    color: $primary-color;
    white-space: nowrap;
  }
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;

  .listed-time {
    font-size: 12px;
    color: $text-muted;
  }
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: $primary-light;
    color: $primary-color;

    &:hover:not(:disabled) {
      background: rgba($primary-color, 0.15);
    }
  }

  &.danger {
    background: rgba($danger-color, 0.1);
    color: $danger-color;

    &:hover:not(:disabled) {
      background: rgba($danger-color, 0.15);
    }
  }
}

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

// ========== 弹窗 ==========
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 16px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid $border-color;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  .modal-close {
    padding: 8px;
    background: transparent;
    border: none;
    font-size: 18px;
    color: $text-muted;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s;

    &:hover {
      background: $background-light;
      color: $text-primary;
    }
  }
}

.modal-body {
  padding: 24px;
}

.item-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $background-light;
  border-radius: 8px;
  margin-bottom: 20px;

  .preview-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 6px;
  }

  .preview-name {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }
}

.price-input-group {
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 8px;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .currency-prefix {
    position: absolute;
    left: 14px;
    font-size: 16px;
    font-weight: 500;
    color: $text-secondary;
  }

  .price-input {
    width: 100%;
    padding: 12px 14px 12px 32px;
    border: 1px solid $border-color;
    border-radius: 8px;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    }
  }

  .original-price {
    display: block;
    margin-top: 8px;
    font-size: 13px;
    color: $text-muted;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid $border-color;
  justify-content: flex-end;

  .btn-cancel,
  .btn-confirm {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel {
    background: $background-light;
    border: 1px solid $border-color;
    color: $text-primary;

    &:hover {
      background: #f3f4f6;
    }
  }

  .btn-confirm {
    background: $primary-color;
    border: none;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #5a5eca;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// ========== 响应式 ==========
@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px;
  }

  .actions {
    width: 100%;

    .toggle-btn,
    .refresh-btn {
      flex: 1;
      justify-content: center;
    }
  }

  .selling-card {
    flex-direction: column;
    align-items: stretch;
  }

  .card-content {
    flex-direction: column;
    align-items: stretch;
  }

  .card-actions {
    justify-content: stretch;

    .action-btn {
      flex: 1;
    }
  }
}
</style>
