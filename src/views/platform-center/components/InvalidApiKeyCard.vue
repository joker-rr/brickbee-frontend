<script setup lang="ts">
/**
 * API Key 失效提示卡片组件
 */

const emit = defineEmits<{
  (e: 'reconfigure'): void
}>()
</script>

<template>
  <div class="invalid-card">
    <div class="card-content">
      <div class="card-icon">
        <span class="error-icon">!</span>
      </div>
      <h3 class="card-title">API Key 已失效</h3>
      <p class="card-desc">您的 API Key 可能已过期或无效，请重新配置</p>
      <button type="button" class="reconfigure-btn" @click="emit('reconfigure')">
        重新配置
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$danger-color: #ef4444;
$danger-light: #fef2f2;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$border-color: #fecaca;

.invalid-card {
  padding: 48px 24px;
  background: $danger-light;
  border: 1px solid $border-color;
  border-radius: 12px;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 320px;
  margin: 0 auto;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: $danger-color;
  border-radius: 50%;
  margin-bottom: 20px;

  .error-icon {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
  }
}

.card-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: $danger-color;
}

.card-desc {
  margin: 0 0 24px;
  font-size: 14px;
  color: $text-secondary;
  line-height: 1.5;
}

.reconfigure-btn {
  padding: 12px 32px;
  background: $danger-color;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #dddfe6;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
