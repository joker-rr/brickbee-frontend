<script setup lang="ts">
import type { SteamItem, FilterOption } from '@/api/modules/items';
import { computed, onMounted, onUnmounted } from 'vue';
import { autoDecimal, timeAgo, toPercentInt } from '@/utils/format';
import {
  getShowBuyPlatform,
  getShowSellPlatform,
  getMinPlatformVolume,
  getMinPlatformUpdate,
  isNegativeProfit,
  isPositiveProfit,
} from '@/utils/item';

// ============================================================================
// Props 定义
// ============================================================================

interface Props {
  item: SteamItem;
  filters?: FilterOption[];
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
});

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 获取当前选择的购买平台
 */
const buyPlatform = computed(() => getShowBuyPlatform(props.filters));

/**
 * 获取当前选择的出售平台
 */
const sellPlatform = computed(() => getShowSellPlatform(props.filters));

// ============================================================================
// 方法
// ============================================================================

/**
 * 判断是否应该显示某个出售平台的信息
 * @param platform - 平台名称 ('MARKET' 或 'CSGOBUY')
 * @returns 是否显示
 */
function shouldShowSellPlatform(platform: string): boolean {
  return !sellPlatform.value || sellPlatform.value === platform;
}




</script>

<template>
  <div class="item-card" id="item-card">
    <!-- ========== 顶部：英文名称 + 利润提示 ========== -->
    <div class="card-header">
      <h3 class="item-name-en">{{ item?.market_hash_name || '-' }}</h3>

      <!-- MARKET 利润提示 -->
      <span v-if="shouldShowSellPlatform('MARKET')" class="profit-badge market-badge" :class="{
        negative: isNegativeProfit(item?.profit_to_market),
        positive: isPositiveProfit(item?.profit_to_market),
      }">
        {{ isPositiveProfit(item?.profit_to_market) ? 'MARKET有利润' : 'MARKET亏钱' }}
      </span>
    </div>

    <!-- ========== 主体：图片 + 信息 ========== -->
    <div class="card-body">
      <!-- 物品图片 -->
      <img v-if="item?.image_300" :src="item.image_300" class="item-image" alt="物品图片" loading="lazy" />

      <div class="card-content">
        <!-- 中文名称 + CSGOBUY 利润提示 -->
        <div class="item-name-row">
          <p class="item-name-cn">{{ item?.market_name || '-' }}</p>

          <!-- CSGOBUY 利润提示 -->
          <span v-if="shouldShowSellPlatform('CSGOBUY')" class="profit-badge csgobuy-badge" :class="{
            negative: isNegativeProfit(item?.profit_to_csgobuy),
            positive: isPositiveProfit(item?.profit_to_csgobuy),
          }">
            {{ isPositiveProfit(item?.profit_to_csgobuy) ? 'CSGOBUY有利润' : 'CSGOBUY亏钱' }}
          </span>
        </div>

        <!-- ========== 价格列表 ========== -->
        <div class="price-list">
          <!-- MARKET 价格 -->
          <div v-if="shouldShowSellPlatform('MARKET')" class="price-row market-price">
            <span class="label market">💵 MARKET(＄):</span>
            <span class="value">{{ autoDecimal(item?.price_market) }}</span>
            <span>在售: {{ autoDecimal(item?.market_volume) }}</span>
            <span>周销量: {{ autoDecimal(item?.market_popularity) }}</span>
            <span class="time-muted">更新: {{ timeAgo(item?.update_market) }}</span>
          </div>

          <!-- CSGOBUY 价格 -->
          <div v-if="shouldShowSellPlatform('CSGOBUY')" class="price-row csgobuy-price">
            <span class="label csgobuy">💴 CSGOBUY(￥):</span>
            <span class="value">{{ autoDecimal(item?.price_csgobuy) }}</span>
            <span>在售: {{ autoDecimal(item?.csgobuy_volume) }}</span>
            <span>周销量: {{ autoDecimal(item?.csgobuy_popularity) }}</span>
            <span class="time-muted">更新: {{ timeAgo(item?.update_csgobuy) }}</span>
          </div>

          <!-- 最低平台价格（默认显示） -->
          <div v-if="!buyPlatform" class="price-row min-price">
            <span class="label min-platform">💴 {{ item?.min_cn_platform }}(￥):</span>
            <span class="value">{{ autoDecimal(item?.min_cn_price) }}</span>
            <span class="corner-badge min-platform">最低平台</span>
            <span>在售: {{ getMinPlatformVolume(item) }}</span>
            <span class="time-muted">更新: {{ timeAgo(getMinPlatformUpdate(item)) }}</span>
          </div>

          <!-- 指定购买平台价格 -->
          <div v-if="buyPlatform" class="price-row min-price">
            <span class="label min-platform">💴 {{ buyPlatform.toUpperCase() }}(￥):</span>
            <span class="value">{{ autoDecimal(item?.['price_' + buyPlatform]) }}</span>
            <span v-if="buyPlatform.toUpperCase() === item?.min_cn_platform" class="corner-badge min-platform">
              最低平台
            </span>
            <span>在售: {{ item?.[buyPlatform + '_volume'] || '-' }}</span>
            <span class="time-muted">更新: {{ timeAgo(getMinPlatformUpdate(item)) }}</span>
          </div>

          <!-- MARKET 利润信息 -->
          <div v-if="shouldShowSellPlatform('MARKET')" class="price-row profit-row">
            <span class="label profit">💰利润(￥):</span>
            <span class="value profit-value" :class="{ negative: isNegativeProfit(item?.profit_to_market) }">
              {{ autoDecimal(item?.profit_to_market) }}
            </span>
            <span>利润率: {{ autoDecimal(toPercentInt(item?.profit_rate_to_market)) }}%</span>
            <span>汇率: {{ autoDecimal(item?.usd_cny) }}</span>
            <span class="corner-badge sell-market">
              <span class="badge-full">—卖到MARKET</span>
              <span class="badge-short">MARKET</span>
            </span>
            <span class="time-muted">更新: {{ timeAgo(item?.update_market) }}</span>
          </div>

          <!-- CSGOBUY 利润信息 -->
          <div v-if="shouldShowSellPlatform('CSGOBUY')" class="price-row profit-row">
            <span class="label profit csgobuy-label">💰利润(￥):</span>
            <span class="value profit-value" :class="{ negative: isNegativeProfit(item?.profit_to_csgobuy) }">
              {{ autoDecimal(item?.profit_to_csgobuy) }}
            </span>
            <span>利润率: {{ autoDecimal(toPercentInt(item?.profit_rate_to_csgobuy)) }}%</span>
            <span class="corner-badge sell-csgobuy">
              <span class="badge-full">—卖到CSGOBUY</span>
              <span class="badge-short">CSGOBUY</span>
            </span>
            <span class="time-muted">更新: {{ timeAgo(item?.update_csgobuy) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ============================================================================
// CSS 变量 - 响应式缩放基础
// ============================================================================
.item-card {
  // 默认尺寸变量
  --card-padding: 12px 15px 15px 12px;
  --card-radius: 16px;
  --header-font-size: 1.24rem;
  --name-cn-font-size: 1rem;
  --badge-font-size: 0.98em;
  --price-font-size: 14px;
  --image-width: 160px;
  --image-height: 130px;
  --body-gap: 28px;
  --price-row-gap: 10px;

  box-sizing: border-box;
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: var(--card-radius);
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.06);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.14);
  }
}

// ============================================================================
// 卡片头部
// ============================================================================
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  // gap: 8px;

  .item-name-en {
    font-size: var(--header-font-size);
    font-weight: 700;
    letter-spacing: 0.4px;
    color: #283e56;
    margin: 0;
    flex: 1;
    min-width: 0;
    // white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// ============================================================================
// 利润徽章
// ============================================================================
.profit-badge {
  font-size: var(--badge-font-size);
  font-weight: 700;
  border-radius: 8px;
  padding: 2px 10px;
  white-space: nowrap;
  transition: all 0.15s;

  &.market-badge {
    background: #e9f8ea;
    color: #2bb352;
    border: 1px solid #aee7c6;

    &.negative {
      color: #e14b4b;
      background: #ffeaea;
      border-color: #facdcd;
    }
  }

  &.csgobuy-badge {
    background: #ceeaf3;
    color: #2b8fb3;
    border: 1px solid #2b8fb3;

    &.negative {
      color: #e14b4b;
      background: #ffeaea;
      border-color: #facdcd;
    }
  }
}

// ============================================================================
// 卡片主体
// ============================================================================
.card-body {
  display: flex;
  align-items: center;
  gap: var(--body-gap);

  .item-image {
    width: var(--image-width);
    height: var(--image-height);
    object-fit: contain;
    border-radius: 8px;
    background: #f7f7f7;
    border: 1px solid #ececec;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    flex-shrink: 0;
  }
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// ============================================================================
// 中文名称行
// ============================================================================
.item-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .item-name-cn {
    font-size: var(--name-cn-font-size);
    font-weight: 600;
    color: #5b7b99;
    margin: 0;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// ============================================================================
// 价格列表
// ============================================================================
.price-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.price-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  background: #f8fafb;
  border-radius: 8px;
  padding: 2px 8px;
  border: 1px solid #f0f3f8;
  gap: var(--price-row-gap);
  font-size: var(--price-font-size);
  font-weight: 500;
  box-sizing: border-box;

  .label {
    font-weight: 600;

    &.market {
      color: #daa520;
    }

    &.csgobuy {
      color: #daa520;
    }

    &.min-platform {
      color: #2bb352;
    }

    &.profit {
      color: #2bb352;
    }

    &.csgobuy-label {
      color: #2b8fb3;
    }
  }

  .value {
    color: #2d86ff;
    font-size: 1.09em;
    text-align: right;
    letter-spacing: 1px;
  }

  .profit-value {
    color: #2d86ff;
    font-weight: 600;
    font-size: 1.09em;
    margin: 0 3px;

    &.negative {
      color: #e14b4b !important;
    }
  }

  .time-muted {
    color: #b5b5b5;
    font-size: 0.93em;
    font-weight: 400;
    margin-left: auto;
  }

  >span:not(.time-muted):not(.corner-badge) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 128px;
    display: inline-block;
  }
}

// ============================================================================
// 角标徽章（最低平台标识）
// ============================================================================
.corner-badge {
  font-size: 0.74em;
  color: #fff;
  background: #2bb352;
  border-radius: 8px;
  padding: 1px 6px;
  white-space: nowrap;
  // font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  letter-spacing: 0.04em;

  // 卖到平台的徽章样式
  &.sell-market {
    background: #2bb352;
  }

  &.sell-csgobuy {
    background: #2b8fb3;
  }

  // 默认显示完整文字，隐藏简短文字
  .badge-full {
    display: inline;

  }

  .badge-short {
    display: none;
  }
}

// ============================================================================
// 响应式设计
// ============================================================================

// 中等屏幕 (平板横屏)
@media (max-width: 900px) {
  .item-card {
    --card-padding: 10px 12px 12px 10px;
    --header-font-size: 1.1rem;
    --name-cn-font-size: 0.9rem;
    --badge-font-size: 0.85em;
    --price-font-size: 13px;
    --image-width: 140px;
    --image-height: 110px;
    --body-gap: 20px;
    --price-row-gap: 8px;
  }
}

// 小屏幕 (平板竖屏)
@media (max-width: 768px) {
  .item-card {
    --card-padding: 10px;
    --card-radius: 12px;
    --header-font-size: 1rem;
    --name-cn-font-size: 0.85rem;
    --badge-font-size: 0.8em;
    --price-font-size: 12px;
    --image-width: 120px;
    --image-height: 95px;
    --body-gap: 16px;
    --price-row-gap: 6px;
  }

  .card-body {
    flex-direction: column;
    align-items: flex-start;

    .item-image {
      width: 100%;
      height: 120px;
      max-width: 200px;
      align-self: center;
    }

    .card-content {
      width: 100%;
    }
  }

  .price-list {
    white-space: normal;
  }

  .price-row {
    span:not(.time-muted) {
      max-width: none;
    }
  }
}

// 小于700px时，卖到平台徽章只显示简短文字
@media (max-width: 700px) {
  .corner-badge {

    &.sell-market,
    &.sell-csgobuy {
      .badge-full {
        display: none;
      }

      .badge-short {
        display: inline;
      }
    }
  }
}

// 手机屏幕
@media (max-width: 480px) {
  .item-card {
    --card-padding: 8px;
    --card-radius: 10px;
    --header-font-size: 0.9rem;
    --name-cn-font-size: 0.8rem;
    --badge-font-size: 0.72em;
    --price-font-size: 11px;
    --image-width: 100px;
    --image-height: 80px;
    --body-gap: 12px;
    --price-row-gap: 4px;
  }

  .card-header {
    margin-bottom: 6px;
  }

  .profit-badge {
    padding: 1px 6px;
    border-radius: 6px;
  }

  .card-body .item-image {
    height: 100px;
    max-width: 160px;
  }

  .price-row {
    padding: 3px 6px;
    border-radius: 6px;
  }

  .corner-badge {
    font-size: 0.65em;
    padding: 1px 4px;
  }
}

// 超小屏幕
@media (max-width: 376px) {
  .item-card {
    --card-padding: 6px;
    --header-font-size: 0.82rem;
    --name-cn-font-size: 0.75rem;
    --badge-font-size: 0.68em;
    --price-font-size: 10px;
    --price-row-gap: 3px;
  }

  .card-body .item-image {
    height: 85px;
    max-width: 140px;
  }
}
</style>
