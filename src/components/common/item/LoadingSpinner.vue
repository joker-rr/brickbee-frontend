<script setup lang="ts">
/**
 * 加载动画组件
 *
 * 参考 brickbee-frontend 的 loading-state 样式
 */

interface Props {
  size?: 'small' | 'medium' | 'large'
  text?: string
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
  text: '加载中'
})
</script>

<template>
  <div class="loading-state" :class="size">
    <div class="loading-spinner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M2 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M18 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>
    <div v-if="text" class="loading-text">
      <span class="loading-primary">{{ text }}</span>
      <span class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  min-height: 120px;
  width: 100%;

  &.small {
    padding: 16px;
    min-height: 60px;

    .loading-spinner svg {
      width: 16px;
      height: 16px;
    }

    .loading-text {
      .loading-primary {
        font-size: 12px;
      }
    }
  }

  &.large {
    padding: 64px 24px;
    min-height: 200px;

    .loading-spinner svg {
      width: 44px;
      height: 44px;
    }

    .loading-text {
      .loading-primary {
        font-size: 16px;
      }
    }
  }
}

.loading-spinner {
  margin-bottom: 16px;
  color: #3b82f6;
  animation: spin 1s linear infinite;

  svg {
    width: 24px;
    height: 24px;
  }
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 4px;

  .loading-primary {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
  }

  .loading-dots {
    display: flex;
    gap: 2px;

    span {
      width: 4px;
      height: 4px;
      background-color: #3b82f6;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;

      &:nth-child(1) {
        animation-delay: -0.32s;
      }

      &:nth-child(2) {
        animation-delay: -0.16s;
      }

      &:nth-child(3) {
        animation-delay: 0s;
      }
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>