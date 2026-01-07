<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { type FilterOption } from '@/api';
import { useItems } from '@/composables';
import { BaseButton, BaseCard } from '@/components/base';
import ItemCard from './components/ItemCard.vue';
import FilterBar from './components/FilterBar.vue';

// --------------------------------------------------------------------------
// 1. 筛选状态
// --------------------------------------------------------------------------

/**
 * 当前激活的筛选条件
 */
const activeFilters = ref<FilterOption[]>([]);

// --------------------------------------------------------------------------
// 2. 使用 Composable
// --------------------------------------------------------------------------

/**
 * 使用物品列表 Composable
 * ✅ loading 和 error 由 useItems 管理
 * ✅ items、total、loadMore 等方法由 Composable 提供
 */
const { items, total, loading, error, hasMore, loadMore, refresh } = useItems(activeFilters);

// --------------------------------------------------------------------------
// 3. 虚拟滚动窗口配置
// --------------------------------------------------------------------------

/**
 * 虚拟滚动窗口范围（只渲染可见区域前后的部分内容）
 * 保留可见区域前后各30个元素，避免DOM节点过多造成内存占用
 */
const BUFFER_SIZE = 80; // 缓冲区大小（可见区域前后各保留30个）
const ITEM_HEIGHT = 300; // 估算的单个 item 高度（像素，根据实际ItemCard调整）

/**
 * 当前滚动位置对应的可见区域索引范围
 */
const visibleRange = ref({ start: 0, end: BUFFER_SIZE * 2 });

/**
 * 上次触发加载更多的滚动位置（防止重复触发）
 */
let lastLoadMoreScrollY = 0;

/**
 * 根据虚拟滚动窗口过滤后的可见 items
 */
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return items.value.slice(start, end);
});

/**
 * 计算上方占位高度（被隐藏的上方元素总高度）
 */
const topPlaceholderHeight = computed(() => {
  return visibleRange.value.start * ITEM_HEIGHT;
});

/**
 * 计算下方占位高度（被隐藏的下方元素总高度）
 */
const bottomPlaceholderHeight = computed(() => {
  const remainingItems = items.value.length - visibleRange.value.end;
  return Math.max(0, remainingItems) * ITEM_HEIGHT;
});

// --------------------------------------------------------------------------
// 4. 响应式 UI 状态
// --------------------------------------------------------------------------

/**
 * 屏幕宽度（用于响应式缩放）
 */
const screenWidth = ref(window.innerWidth);

const itemsGrid = ref<HTMLElement | null>(null);
const itemsGridWith = ref<any>(608)

// --------------------------------------------------------------------------
// 5. 事件处理
// --------------------------------------------------------------------------

/**
 * 更新虚拟滚动窗口的可见范围
 */
const updateVisibleRange = () => {
  const scrollTop = window.scrollY;
  const viewportHeight = window.innerHeight;

  // 计算当前滚动位置对应的索引
  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT);

  // 计算可见范围（加上前后缓冲区）
  const start = Math.max(0, startIndex - BUFFER_SIZE);
  const end = Math.min(items.value.length, Math.max(startIndex + visibleCount + BUFFER_SIZE, BUFFER_SIZE * 2));

  visibleRange.value = { start, end };
};

/**
 * 节流定时器（避免滚动事件触发过于频繁）
 */
let scrollTimer: number | null = null;

/**
 * 处理滚动事件（触底加载 + 虚拟滚动窗口更新）
 * 使用节流优化性能
 */
const handleScroll = () => {
  // 节流处理：150ms 内只执行一次
  if (scrollTimer) {
    return;
  }

  scrollTimer = window.setTimeout(() => {
    // 1. 更新虚拟滚动窗口
    updateVisibleRange();

    // 2. 触底加载更多数据
    if (!loading.value && hasMore.value) {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 300; // 增加阈值到300px

      // 只有向下滚动且超过阈值，并且距离上次加载位置有显著变化时才触发
      const scrollDelta = Math.abs(window.scrollY - lastLoadMoreScrollY);

      if (scrollPosition >= threshold && scrollDelta > 500) {
        lastLoadMoreScrollY = window.scrollY;
        loadMore();
      }
    }

    scrollTimer = null;
  }, 150);
};

/**
 * 重置我们的滚轮位置
 */
const resetScrollState = () => {
  lastLoadMoreScrollY = 0;
  visibleRange.value = { start: 0, end: BUFFER_SIZE * 2 };

  // ⚠️ 关键：回到顶部
  window.scrollTo({ top: 0 });
};

/**
 * 处理窗口大小变化
 */
const handleResize = () => {
  screenWidth.value = window.innerWidth;
  itemsGridWith.value = itemsGrid.value?.clientWidth;

  // 窗口大小变化时也需要更新可见范围
  updateVisibleRange();
};

/**
 * 刷新列表
 */
const handleRefresh = async () => {
  resetScrollState();
  await refresh();
  // 刷新后重置可见范围
  visibleRange.value = { start: 0, end: BUFFER_SIZE * 2 };
  updateVisibleRange();
};

/**
 * 处理筛选条件变化
 */
const handleFilterChange = (filters: FilterOption[]) => {
  resetScrollState();
  activeFilters.value = filters;
};


// --------------------------------------------------------------------------
// 6. 监听数据变化
// --------------------------------------------------------------------------

/**
 * 监听 items 数据变化，确保首次加载和筛选后更新可见范围
 */
watch(() => items.value.length, (newLength) => {
  if (newLength > 0) {
    // 确保至少显示初始数量的 items
    const minEnd = Math.min(newLength, BUFFER_SIZE * 2);
    if (visibleRange.value.end < minEnd) {
      visibleRange.value.end = minEnd;
    }
  }
});




// --------------------------------------------------------------------------
// 7. 生命周期
// --------------------------------------------------------------------------

onMounted(() => {
  // 监听滚动和窗口大小变化
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', handleResize);

  // 初始化虚拟滚动窗口
  updateVisibleRange();

  // 初始化网格宽度
  if (itemsGrid.value) {
    itemsGridWith.value = itemsGrid.value.clientWidth;
  }
});

onUnmounted(() => {
  // 清理定时器
  if (scrollTimer) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }

  // 移除事件监听
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="items-page">
    <div class="page-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Steam 饰品列表</h1>
          <!-- 筛选栏 -->
          <FilterBar :active-filters="activeFilters" @filter-change="handleFilterChange" />
          <p class="page-subtitle">共 <span class="count">{{ total }}</span> 个饰品</p>
        </div>
        <div class="header-actions">
          <BaseButton type="primary" icon="🔄" :loading="loading" @click="handleRefresh">
            刷新
          </BaseButton>
        </div>
      </div>



      <!-- 错误提示 -->
      <BaseCard v-if="error" class="error-card" shadow="always">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <div class="error-text">
            <h3>加载失败</h3>
            <p>{{ error.message }}</p>
          </div>
          <BaseButton type="danger" @click="handleRefresh">重试</BaseButton>
        </div>
      </BaseCard>

      <!-- 物品列表（虚拟滚动） -->
      <div v-if="!error" class="items-wrapper">
        <!-- 上方占位元素（被隐藏的上方内容高度） -->
        <div v-if="topPlaceholderHeight > 0" :style="{ height: `${topPlaceholderHeight}px` }"></div>

        <!-- 实际渲染的可见区域 items -->
        <div ref="itemsGrid" class="items-grid" id="items-grid">
          <ItemCard v-for="item in visibleItems" :key="item.market_hash_name" :item="item" :filters="activeFilters" />
        </div>

        <!-- 下方占位元素（被隐藏的下方内容高度） -->
        <div v-if="bottomPlaceholderHeight > 0" :style="{ height: `${bottomPlaceholderHeight}px` }"></div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading && items.length > 0" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载更多中...</p>
      </div>

      <!-- 初次加载 -->
      <div v-if="loading && items.length === 0" class="loading-container initial-loading">
        <div class="loading-spinner large"></div>
        <p>正在加载饰品列表...</p>
      </div>

      <!-- 无数据提示 -->
      <BaseCard v-if="!loading && !error && items.length === 0" class="empty-card" shadow="never">
        <div class="empty-state">
          <span class="empty-icon">📦</span>
          <h3>暂无数据</h3>
          <p>当前没有找到任何饰品</p>
        </div>
      </BaseCard>

      <!-- 已加载全部提示 -->
      <div v-if="!loading && !error && items.length > 0 && !hasMore" class="end-message">
        <div class="end-divider"></div>
        <span class="end-text">已加载全部 {{ total }} 个饰品</span>
        <div class="end-divider"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.items-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 32px 0;
}

.page-container {
  margin: 0 auto;
  padding: 0 24px;
}

// --------------------------------------------------------------------------
// 页面头部
// --------------------------------------------------------------------------

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  width: 100%;

  .page-title {
    font-size: 32px;
    font-weight: bold;
    color: #333;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
    width: 100%;
  }

  .page-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;

    .count {
      font-weight: 600;
      color: #667eea;
      font-size: 18px;
    }
  }
}

.header-actions {
  display: flex;
  gap: 12px;
}

// --------------------------------------------------------------------------
// 筛选栏
// --------------------------------------------------------------------------

.filter-bar {
  margin-bottom: 24px;
}

// --------------------------------------------------------------------------
// 错误卡片
// --------------------------------------------------------------------------

.error-card {
  margin-bottom: 24px;
  border: 2px solid #ffccc7;
  background: #fff1f0 !important;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px;

  .error-icon {
    font-size: 48px;
    flex-shrink: 0;
  }

  .error-text {
    flex: 1;

    h3 {
      margin: 0 0 6px 0;
      font-size: 18px;
      color: #f5222d;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
  }
}

// --------------------------------------------------------------------------
// 物品网格
// --------------------------------------------------------------------------

//为了更好地观察移到了下面
// --------------------------------------------------------------------------
// 加载状态
// --------------------------------------------------------------------------

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;

  &.initial-loading {
    min-height: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f0f0f0;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;

    &.large {
      width: 60px;
      height: 60px;
      border-width: 6px;
    }
  }

  p {
    font-size: 15px;
    color: #666;
    font-weight: 500;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// --------------------------------------------------------------------------
// 空状态
// --------------------------------------------------------------------------

.empty-card {
  border: 2px dashed #d9d9d9 !important;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 64px;
    display: block;
    margin-bottom: 20px;
    opacity: 0.5;
  }

  h3 {
    font-size: 20px;
    color: #333;
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  p {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

// --------------------------------------------------------------------------
// 结束提示
// --------------------------------------------------------------------------

.end-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px 20px;

  .end-divider {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right,
        transparent,
        rgba(102, 126, 234, 0.3),
        transparent);
    max-width: 200px;
  }

  .end-text {
    color: #667eea;
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    padding: 8px 20px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 20px;
  }
}

// // --------------------------------------------------------------------------
// 响应式设计
// --------------------------------------------------------------------------

// 物品网格 - 响应式调整
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(750px, 100%), 1fr));

  // 使用固定的单列布局，避免 auto-fill 在加载更多时重新计算导致卡片变大
  // grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 40px;
  // 限制最大宽度，防止卡片过宽
  // max-width: 800px;
  // margin-left: auto;
  // margin-right: auto;
}

// 大屏幕 (> 1200px) - 默认样式已覆盖
@media (min-width: 1200px) {
  .header-content {
    width: 50%;
  }
}

// 中大屏幕 (1024px - 1200px)
@media (max-width: 1200px) {
  .page-container {
    max-width: 100%;
  }

  .items-grid {
    gap: 16px;
  }

  .header-content {
    width: 70%;
  }
}

// 平板横屏 (769px - 1024px)
@media(max-width: 1024px) {
  .items-page {
    padding: 24px 0;
  }

  .page-header {
    padding: 20px;
    margin-bottom: 24px;

    .page-title {
      font-size: 28px;
    }
  }

  .loading-container {
    &.initial-loading {
      min-height: 300px;
    }
  }

  .header-content {
    width: 80%;
  }
}

// 平板竖屏及以下 (≤ 768px)
@media (max-width: 768px) {
  .items-page {
    padding: 16px 0;
  }

  .page-container {
    padding: 0 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    margin-bottom: 20px;
    border-radius: 8px;

    .page-title {
      font-size: 24px;
    }

    .page-subtitle {
      font-size: 14px;

      .count {
        font-size: 16px;
      }
    }
  }

  .header-actions {
    width: 100%;

    :deep(button) {
      flex: 1;
    }
  }

  .items-grid {
    gap: 12px;
    margin-bottom: 24px;
  }

  .error-card {
    margin-bottom: 16px;
  }

  .error-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 8px;

    .error-icon {
      font-size: 40px;
    }

    .error-text {
      h3 {
        font-size: 16px;
      }

      p {
        font-size: 13px;
      }
    }

    :deep(button) {
      width: 100%;
    }
  }

  .loading-container {
    padding: 32px 16px;
    gap: 12px;

    &.initial-loading {
      min-height: 280px;
      border-radius: 8px;
    }

    .loading-spinner {
      width: 36px;
      height: 36px;

      &.large {
        width: 48px;
        height: 48px;
      }
    }

    p {
      font-size: 14px;
    }
  }

  .empty-state {
    padding: 40px 16px;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
    }
  }

  .end-message {
    padding: 32px 16px;
    gap: 12px;

    .end-divider {
      max-width: 80px;
    }

    .end-text {
      font-size: 13px;
      padding: 6px 16px;
    }
  }
}

// 手机 (≤ 480px)
// @media (max-width: 480px) {
//   .items-page {
//     padding: 12px 0;
//   }

//   .page-container {
//     padding: 0 12px;
//   }

//   .page-header {
//     padding: 14px;
//     gap: 12px;
//     border-radius: 6px;
//     margin-bottom: 16px;

//     .page-title {
//       font-size: 20px;
//     }

//     .page-subtitle {
//       font-size: 13px;

//       .count {
//         font-size: 15px;
//       }
//     }
//   }

//   .items-grid {
//     gap: 10px;
//     margin-bottom: 20px;
//   }

//   .error-content {
//     .error-icon {
//       font-size: 36px;
//     }
//   }

//   .empty-state {
//     padding: 32px 12px;

//     .empty-icon {
//       font-size: 40px;
//     }

//     h3 {
//       font-size: 16px;
//     }
//   }

//   .end-message {
//     padding: 24px 12px;

//     .end-text {
//       font-size: 12px;
//       padding: 5px 12px;
//     }
//   }
// }

// 超小屏幕 (≤ 360px)
@media (max-width: 360px) {
  .header-content {
    width: 80%;
    font-size: 10px;
  }
}
</style>
