<script setup lang="ts">
/**
 * 状态标签组件
 *
 * 支持多种状态类型：
 * - tradable/non_tradable: 交易状态
 * - active/pending/sold: 在售状态
 * - 数字状态码 (1-7): 平台特定状态
 */

import { computed } from 'vue'

interface Props {
  status: string | number
}

const props = defineProps<Props>()

// 状态映射表
const statusMap: Record<string | number, { text: string; type: string }> = {
  // 交易状态
  tradable: { text: '可交易', type: 'success' },
  non_tradable: { text: '不可交易', type: 'danger' },

  // 在售状态
  active: { text: '在售', type: 'success' },
  pending: { text: '处理中', type: 'warning' },
  sold: { text: '已售出', type: 'muted' },

  // 数字状态码 (平台特定)
  1: { text: '上架中', type: 'success' },
  2: { text: '待发货', type: 'warning' },
  3: { text: '待收货', type: 'warning' },
  4: { text: '已完成', type: 'success' },
  7: { text: '交易中', type: 'info' }
}

const statusInfo = computed(() => {
  return statusMap[props.status] || { text: String(props.status), type: 'default' }
})

const statusClass = computed(() => {
  return `status-${statusInfo.value.type}`
})
</script>

<template>
  <span class="status-badge" :class="statusClass">
    {{ statusInfo.text }}
  </span>
</template>

<style lang="scss" scoped>
.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;

  &.status-success {
    background-color: #d1fae5;
    color: #059669;
  }

  &.status-warning {
    background-color: #fef3c7;
    color: #d97706;
  }

  &.status-danger {
    background-color: #fee2e2;
    color: #dc2626;
  }

  &.status-info {
    background-color: #dbeafe;
    color: #2563eb;
  }

  &.status-muted {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  &.status-default {
    background-color: #f3f4f6;
    color: #374151;
  }
}
</style>