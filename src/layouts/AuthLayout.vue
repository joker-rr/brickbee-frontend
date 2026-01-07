<template>
  <div class="auth-layout">
    <div class="auth-container">
      <!-- 左侧品牌区域 -->
      <div class="auth-brand">
        <div class="brand-content">
          <h1 class="brand-title">BrickBee</h1>
          <p class="brand-subtitle">CS2 饰品交易管理平台</p>
          <ul class="brand-features">
            <li>
              <span class="feature-icon">✓</span>
              多平台库存管理
            </li>
            <li>
              <span class="feature-icon">✓</span>
              实时价格追踪
            </li>
            <li>
              <span class="feature-icon">✓</span>
              利润分析统计
            </li>
            <li>
              <span class="feature-icon">✓</span>
              销售历史记录
            </li>
          </ul>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="auth-form">
        <div class="form-container">
          <slot></slot>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="auth-footer">
      <p>&copy; {{ currentYear }} BrickBee. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'AuthLayout'
})

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.auth-container {
  flex: 1;
  display: flex;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.auth-brand {
  flex: 1;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;

  @media (max-width: 768px) {
    padding: 32px;
  }
}

.brand-content {
  max-width: 400px;
  color: #fff;
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 16px;

  @media (max-width: 768px) {
    font-size: 32px;
  }
}

.brand-subtitle {
  font-size: 18px;
  margin: 0 0 32px;
  opacity: 0.9;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 24px;
  }
}

.brand-features {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    margin-bottom: 16px;
    opacity: 0.9;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .feature-icon {
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
}

.auth-form {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #fff;

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
}

.form-container {
  width: 100%;
  max-width: 400px;
}

.auth-footer {
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 16px;
  text-align: center;

  p {
    margin: 0;
    color: #999;
    font-size: 12px;
  }
}
</style>
