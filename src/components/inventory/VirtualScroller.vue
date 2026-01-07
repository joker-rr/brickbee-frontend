<script setup lang="ts">
/**
 * 虚拟滚动组件
 *
 * 用于大量物品的高性能渲染
 */

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

// Props
const props = withDefaults(
  defineProps<{
    items: unknown[]
    itemHeight?: number
    bufferSize?: number
    containerHeight?: string
  }>(),
  {
    itemHeight: 120,
    bufferSize: 5,
    containerHeight: '600px'
  }
)

// Emits
const emit = defineEmits<{
  (e: 'visible-items-change', items: unknown[]): void
}>()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeightPx = ref(0)

// Computed
const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight)
  return Math.max(0, index - props.bufferSize)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerHeightPx.value / props.itemHeight)
  const index = startIndex.value + visibleCount + props.bufferSize * 2
  return Math.min(props.items.length, index)
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
    item,
    index: startIndex.value + index
  }))
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

// 节流处理滚动
let rafId: number | null = null

function handleScroll(): void {
  if (rafId) return

  rafId = requestAnimationFrame(() => {
    if (containerRef.value) {
      scrollTop.value = containerRef.value.scrollTop
    }
    rafId = null
  })
}

function updateContainerHeight(): void {
  if (containerRef.value) {
    containerHeightPx.value = containerRef.value.clientHeight
  }
}

// 监听可见物品变化
watch(
  visibleItems,
  items => {
    emit(
      'visible-items-change',
      items.map(i => i.item)
    )
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateContainerHeight)
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
})

// 暴露方法
function scrollToIndex(index: number): void {
  if (containerRef.value) {
    containerRef.value.scrollTop = index * props.itemHeight
  }
}

function scrollToTop(): void {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

defineExpose({
  scrollToIndex,
  scrollToTop
})
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-scroller"
    :style="{ height: containerHeight }"
    @scroll="handleScroll"
  >
    <div class="virtual-scroller-content" :style="{ height: `${totalHeight}px` }">
      <div class="virtual-scroller-items" :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="{ item, index } in visibleItems"
          :key="index"
          class="virtual-scroller-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.virtual-scroller {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  // 美化滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.virtual-scroller-content {
  position: relative;
}

.virtual-scroller-items {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-scroller-item {
  box-sizing: border-box;
}
</style>
