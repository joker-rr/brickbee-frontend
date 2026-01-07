<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { systemApi } from '@/api';
import { logger } from '@/utils/logger';
import { useAuth } from '@/composables';
import { toast } from '@/utils/toast';
import LogoIcon from '@/components/common/LogoIcon.vue';

// --------------------------------------------------------------------------
// 1. 使用 Composable
// --------------------------------------------------------------------------

const { isLoggedIn, currentUser } = useAuth();
const router = useRouter();

// --------------------------------------------------------------------------
// 2. 后端连接测试
// --------------------------------------------------------------------------

const backendStatus = ref<'loading' | 'success' | 'error'>('loading');
const backendMessage = ref('');

// 环境信息
const envMode = computed(() => import.meta.env.MODE);
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL);

onMounted(async () => {
  try {
    const response = await systemApi.healthCheck();

    backendStatus.value = 'success';
    backendMessage.value = response.data?.message || '后端连接成功！';

    logger.log('✅ 后端连接成功');
    logger.log('响应数据:', response.data);
    logger.log('HTTP 状态码:', response.status);
  } catch (error: any) {
    backendStatus.value = 'error';
    backendMessage.value = '后端连接失败: ' + error.message;

    logger.error('❌ 后端连接失败:', error);
  }
});

// --------------------------------------------------------------------------
// 3. 快速导航
// --------------------------------------------------------------------------

const navigateToItems = () => {
  router.push('/items');
};

const navigateToLogin = () => {
  router.push('/login');
};

// 测试 Toast 系统
const testToast = () => {
  toast.success('这是成功消息！');
  setTimeout(() => toast.error('这是错误消息！'), 500);
  setTimeout(() => toast.warning('这是警告消息！'), 1000);
  setTimeout(() => toast.info('这是信息消息！'), 1500);
};

// 导航到组件演示页面
const navigateToComponentsDemo = () => {
  router.push('/components-demo');
};

// --------------------------------------------------------------------------
// 4. 功能卡片数据
// --------------------------------------------------------------------------

const features = [
  {
    icon: '📊',
    title: '实时价格监控',
    description: '多平台价格对比分析',
    color: '#409EFF',
  },
  {
    icon: '💰',
    title: '利润计算',
    description: '精准计算交易利润',
    color: '#67C23A',
  },
  {
    icon: '📈',
    title: '历史数据',
    description: '销售历史统计分析',
    color: '#E6A23C',
  },
];
</script>

<template>
  <div class="home-page">
    <div class="hero-section">
      <!-- Logo -->
      <div class="logo">
        <LogoIcon :size="100" />
      </div>

      <!-- 标题 -->
      <h1 class="title">欢迎来到 BrickBee</h1>
      <p class="subtitle">CS:GO 皮肤交易智能分析平台 - TypeScript 重构版</p>

      <!-- 用户信息卡片 (已登录时显示) -->
      <div v-if="isLoggedIn && currentUser" class="user-card">
        <div class="card-header">
          <span class="user-icon">👤</span>
          <span>个人信息</span>
        </div>
        <div class="user-info">
          <div class="info-item">
            <span class="label">用户名</span>
            <span class="value">{{ currentUser.nickname }}</span>
          </div>
          <!-- <div class="info-item">
            <span class="label">邮箱</span>
            <span class="value">{{ currentUser.email }}</span>
          </div> -->
        </div>
      </div>

      <!-- 后端连接状态 -->
      <div class="backend-status" :class="`status-${backendStatus}`">
        <div v-if="backendStatus === 'loading'" class="status-content">
          <span class="loading-spinner"></span>
          正在连接后端...
        </div>
        <div v-else-if="backendStatus === 'success'" class="status-content">
          ✓ {{ backendMessage }}
        </div>
        <div v-else class="status-content">✗ {{ backendMessage }}</div>
      </div>

      <!-- 快速导航 -->
      <div class="quick-actions">
        <button class="action-button primary" @click="navigateToItems">
          🔍 浏览饰品列表
        </button>
        <button v-if="!isLoggedIn" class="action-button secondary" @click="navigateToLogin">
          🔐 登录账号
        </button>
        <button class="action-button warning" @click="testToast">
          🧪 测试 Toast 消息
        </button>
        <button class="action-button info" @click="navigateToComponentsDemo">
          🎨 组件演示
        </button>
      </div>

      <!-- 功能卡片 -->
      <div class="features">
        <div v-for="(feature, index) in features" :key="index" class="feature-card">
          <div class="feature-icon" :style="{ color: feature.color }">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>

      <!-- 版本信息 -->
      <div class="version-info">
        <p>前端版本: TypeScript Refactor v1.0</p>
        <p>环境: {{ envMode }}</p>
        <p>API 地址: {{ apiBaseUrl }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box; // ✅ 关键
}

.hero-section {
  max-width: 1000px;
  text-align: center;
  color: white;
  padding: 40px 20px;
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  animation: float 3s ease-in-out infinite;

  svg {
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 20px;
  margin-bottom: 40px;
  opacity: 0.9;
}

// 用户信息卡片
.user-card {
  max-width: 500px;
  margin: 0 auto 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: rgba(64, 158, 255, 0.1);
    border-bottom: 1px solid rgba(64, 158, 255, 0.2);
    font-weight: 600;
    color: #409eff;
    font-size: 16px;

    .user-icon {
      font-size: 20px;
    }
  }

  .user-info {
    padding: 20px;
    color: #333;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 600;
        color: #666;
      }

      .value {
        color: #333;
      }
    }
  }
}

// 后端状态
.backend-status {
  max-width: 600px;
  margin: 0 auto 32px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;

  &.status-loading {
    background-color: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  &.status-success {
    background-color: rgba(82, 196, 26, 0.2);
    border: 2px solid #52c41a;
  }

  &.status-error {
    background-color: rgba(245, 34, 45, 0.2);
    border: 2px solid #f5222d;
  }

  .status-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 快速导航
.quick-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 48px;
  flex-wrap: wrap;

  .action-button {
    padding: 14px 32px;
    font-size: 18px;
    font-weight: 600;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: translateY(-1px);
    }

    &.primary {
      background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    }

    &.secondary {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      border: 2px solid rgba(255, 255, 255, 0.3);

      &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
      }
    }

    &.warning {
      background: linear-gradient(135deg, #faad14 0%, #fa8c16 100%);
    }

    &.info {
      background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    }
  }
}

// 功能卡片
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 32px 24px;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .feature-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 20px;
    margin-bottom: 8px;
    color: #333;
    font-weight: 600;
  }

  p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
}

// 版本信息
.version-info {
  font-size: 12px;
  opacity: 0.7;

  p {
    margin: 4px 0;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .title {
    font-size: 32px;
  }

  .subtitle {
    font-size: 16px;
  }

  .quick-actions {
    flex-direction: column;
    align-items: center;

    .action-button {
      width: 100%;
      max-width: 300px;
    }
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
