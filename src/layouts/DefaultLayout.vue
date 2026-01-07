<template>
  <div class="default-layout">
    <!-- 头部导航 -->
    <header class="layout-header">
      <div class="header-content">
        <div class="logo">
          <router-link to="/">
            <span class="logo-text">BrickBee</span>
          </router-link>
        </div>

        <nav class="main-nav">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/items" class="nav-item">物品列表</router-link>
        </nav>

        <div class="header-actions">
          <template v-if="isLoggedIn">
            <span class="user-info">{{ userNickname }}</span>
            <button class="btn btn-text" @click="handleLogout">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-text">登录</router-link>
            <router-link to="/register" class="btn btn-primary">注册</router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- 侧边栏（可选） -->
    <aside v-if="showSidebar" class="layout-sidebar">
      <slot name="sidebar">
        <!-- 默认侧边栏内容 -->
      </slot>
    </aside>

    <!-- 主内容区域 -->
    <main class="layout-main" :class="{ 'with-sidebar': showSidebar }">
      <slot></slot>
    </main>

    <!-- 页脚 -->
    <footer class="layout-footer">
      <div class="footer-content">
        <p>&copy; {{ currentYear }} BrickBee. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'

defineOptions({
  name: 'DefaultLayout'
})

interface Props {
  showSidebar?: boolean
}

withDefaults(defineProps<Props>(), {
  showSidebar: false
})

const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userNickname = computed(() => userStore.displayName || '用户')
const currentYear = computed(() => new Date().getFullYear())

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  a {
    text-decoration: none;
  }

  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: #1890ff;
  }
}

.main-nav {
  display: flex;
  gap: 24px;

  .nav-item {
    color: #333;
    text-decoration: none;
    font-size: 14px;
    padding: 8px 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &:hover,
    &.router-link-active {
      color: #1890ff;
      border-bottom-color: #1890ff;
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;

  .user-info {
    font-size: 14px;
    color: #666;
  }
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: all 0.2s;

  &.btn-text {
    background: transparent;
    color: #666;

    &:hover {
      color: #1890ff;
    }
  }

  &.btn-primary {
    background: #1890ff;
    color: #fff;

    &:hover {
      background: #40a9ff;
    }
  }
}

.layout-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  overflow-y: auto;
}

.layout-main {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;

  &.with-sidebar {
    margin-left: 240px;
  }
}

.layout-footer {
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 24px;

  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    text-align: center;

    p {
      margin: 0;
      color: #999;
      font-size: 14px;
    }
  }
}
</style>
