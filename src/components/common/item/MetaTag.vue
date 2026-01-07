<script setup lang="ts">
/**
 * 元信息标签组件
 *
 * 用于显示物品的属性信息：
 * - rarity: 稀有度
 * - category: 类别
 * - exterior: 外观/磨损
 * - nametag: 名称标签
 */

interface Props {
  type: 'rarity' | 'category' | 'exterior' | 'nametag' | string
}

defineProps<Props>()
</script>

<template>
  <span class="meta-tag" :class="`meta-${type}`">
    <span v-if="type === 'nametag'" class="nametag-icon">&#x1F3AF;</span>
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;

  &.meta-rarity {
    background-color: #fef3c7;
    color: #92400e;
  }

  &.meta-category {
    background-color: #dbeafe;
    color: #1e40af;
  }

  &.meta-exterior {
    background-color: #f3e8ff;
    color: #7c3aed;
  }

  &.meta-nametag {
    background-color: #fed7d7;
    color: #c53030;

    .nametag-icon {
      font-size: 10px;
    }
  }
}
</style>