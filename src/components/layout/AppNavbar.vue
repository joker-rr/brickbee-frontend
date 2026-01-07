<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables'
import LogoIcon from '@/components/common/LogoIcon.vue'

// --------------------------------------------------------------------------
// 1. Composables
// --------------------------------------------------------------------------

const router = useRouter()
const route = useRoute()
const { isLoggedIn, currentUser, logout } = useAuth()

// --------------------------------------------------------------------------
// 2. 状态
// --------------------------------------------------------------------------

// 用户菜单展开状态
const showUserMenu = ref(false)

// 移动端菜单展开状态
const showMobileMenu = ref(false)

// --------------------------------------------------------------------------
// 3. 导航菜单配置
// --------------------------------------------------------------------------

interface NavItem {
  name: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  { name: '首页', path: '/', icon: '🏠' },
  { name: '饰品列表', path: '/items', icon: '📦' },
  { name: '平台中心', path: '/platform-center', icon: '🔧' },
  { name: '组件演示', path: '/components-demo', icon: '🎨' },
]

// --------------------------------------------------------------------------
// 4. 计算属性
// --------------------------------------------------------------------------

/**
 * 当前激活的导航项
 */
const activeNav = computed(() => {
  return route.path
})

// --------------------------------------------------------------------------
// 5. 方法
// --------------------------------------------------------------------------

/**
 * 导航到指定路径
 */
const navigateTo = (path: string) => {
  router.push(path)
  closeMenus()
}

/**
 * 导航到登录页
 */
const handleLogin = () => {
  closeMenus()
  router.push('/login')
}

/**
 * 导航到个人中心
 */
const handleProfile = () => {
  router.push('/profile')
  closeMenus()
}

/**
 * 登出
 */
const handleLogout = async () => {
  closeMenus()
  await logout()
}

/**
 * 切换用户菜单
 */
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

/**
 * 切换移动端菜单
 */
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

/**
 * 关闭所有菜单
 */
const closeMenus = () => {
  showUserMenu.value = false
  showMobileMenu.value = false
}
</script>

<template>
  <nav class="app-navbar">
    <div class="navbar-container">
      <!-- Logo 和应用名 -->
      <div class="navbar-brand" @click="navigateTo('/')">
        <LogoIcon :size="40" />
        <span class="brand-name">BrickBee</span>
      </div>

      <!-- 导航菜单 (桌面端) -->
      <div class="navbar-menu desktop-only">
        <a v-for="item in navItems" :key="item.path" class="nav-item" :class="{ active: activeNav === item.path }"
          @click="navigateTo(item.path)">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </a>
      </div>

      <!-- 右侧用户区域 -->
      <div class="navbar-actions">
        <!-- 未登录状态 -->
        <div v-if="!isLoggedIn" class="login-area desktop-only">
          <button class="login-button" @click="handleLogin">登录</button>
        </div>

        <!-- 已登录状态 -->
        <div v-else class="user-area desktop-only">
          <div class="user-info" @click="toggleUserMenu">
            <div class="user-avatar">{{ currentUser?.nickname?.charAt(0)?.toUpperCase() || 'U' }}</div>
            <span class="user-name">{{ currentUser?.nickname }}</span>
            <span class="dropdown-icon">▼</span>
          </div>

          <!-- 用户下拉菜单 -->
          <Transition name="dropdown">
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="dropdown-item" @click="handleProfile">
                <span class="item-icon">👤</span>
                <span>个人中心</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item logout" @click="handleLogout">
                <span class="item-icon">🚪</span>
                <span>退出登录</span>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-button mobile-only" @click="toggleMobileMenu">
          <span class="menu-icon">{{ showMobileMenu ? '✕' : '☰' }}</span>
        </button>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <Transition name="mobile-menu">
      <div v-if="showMobileMenu" class="mobile-menu">
        <!-- 导航菜单 -->
        <div class="mobile-nav">
          <a v-for="item in navItems" :key="item.path" class="mobile-nav-item"
            :class="{ active: activeNav === item.path }" @click="navigateTo(item.path)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.name }}</span>
          </a>
        </div>

        <!-- 用户区域 -->
        <div class="mobile-user">
          <div v-if="!isLoggedIn" class="mobile-login">
            <button class="mobile-login-button" @click="handleLogin">登录</button>
          </div>
          <div v-else class="mobile-user-info">
            <div class="user-card">
              <div class="user-avatar">{{ currentUser?.nickname?.charAt(0)?.toUpperCase() || 'U' }}</div>
              <div class="user-details">
                <div class="user-name">{{ currentUser?.nickname }}</div>
                <div class="user-email">{{ currentUser?.email }}</div>
              </div>
            </div>
            <div class="mobile-user-actions">
              <button class="mobile-action-button" @click="handleProfile">个人中心</button>
              <button class="mobile-action-button logout" @click="handleLogout">退出登录</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 遮罩层 (点击关闭菜单) -->
    <Transition name="fade">
      <div v-if="showUserMenu || showMobileMenu" class="navbar-overlay" @click="closeMenus"></div>
    </Transition>
  </nav>
</template>

<style lang="scss" scoped>
.app-navbar {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// --------------------------------------------------------------------------
// Logo 和品牌
// --------------------------------------------------------------------------

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;

  .brand-name {
    font-size: 24px;
    font-weight: bold;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:hover :deep(.logo-icon) {
    transform: scale(1.1) rotate(5deg);
  }
}

// --------------------------------------------------------------------------
// 桌面端导航菜单
// --------------------------------------------------------------------------

.navbar-menu {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
  margin: 0 40px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  user-select: none;

  .nav-icon {
    font-size: 18px;
  }

  .nav-text {
    font-size: 15px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  &.active {
    background: rgba(255, 255, 255, 0.25);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

// --------------------------------------------------------------------------
// 用户区域
// --------------------------------------------------------------------------

.navbar-actions {
  display: flex;
  align-items: center;
}

.login-area {
  .login-button {
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 8px;
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.6);
      transform: translateY(-2px);
    }
  }
}

.user-area {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
  }

  .user-name {
    color: white;
    font-weight: 600;
    font-size: 14px;
  }

  .dropdown-icon {
    color: rgba(255, 255, 255, 0.8);
    font-size: 10px;
    transition: transform 0.3s ease;
  }
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 999;


  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: #333;
    cursor: pointer;
    transition: background 0.2s ease;
    user-select: none;

    .item-icon {
      font-size: 18px;
    }

    &:hover {
      background: #f5f5f5;
    }

    &.logout {
      color: #f5222d;

      &:hover {
        background: #fff1f0;
      }
    }
  }

  .dropdown-divider {
    height: 1px;
    background: #eee;
    margin: 4px 0;
  }
}

// --------------------------------------------------------------------------
// 移动端菜单
// --------------------------------------------------------------------------

.mobile-menu-button {
  display: none;
  padding: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .menu-icon {
    display: block;
    width: 28px;
    text-align: center;
  }
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.mobile-nav {
  padding: 12px 0;
  border-bottom: 1px solid #eee;

}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;

  .nav-icon {
    font-size: 20px;
  }

  .nav-text {
    font-size: 16px;
    font-weight: 500;
  }

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e6f7ff;
    color: #1890ff;
  }
}

.mobile-user {
  padding: 16px 24px;
}

.mobile-login {
  .mobile-login-button {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.98);
    }
  }
}

.mobile-user-info {
  .user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 12px;

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
    }

    .user-details {
      flex: 1;

      .user-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .user-email {
        font-size: 12px;
        color: #666;
      }
    }
  }

  .mobile-user-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .mobile-action-button {
      width: 100%;
      padding: 12px;
      background: white;
      border: 2px solid #d9d9d9;
      border-radius: 8px;
      color: #333;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:active {
        transform: scale(0.98);
      }

      &.logout {
        color: #f5222d;
        border-color: #ffccc7;

        &:hover {
          background: #fff1f0;
          border-color: #ffa39e;
        }
      }
    }
  }
}

// --------------------------------------------------------------------------
// 遮罩层
// --------------------------------------------------------------------------

.navbar-overlay {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 998;
}

// --------------------------------------------------------------------------
// 响应式
// --------------------------------------------------------------------------

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .navbar-container {
    padding: 0 16px;
  }

  .navbar-brand {
    .brand-name {
      font-size: 20px;
    }

    :deep(.logo-icon) {
      width: 32px;
      height: 32px;
    }
  }

  .mobile-menu-button {
    display: block;
  }
}

// --------------------------------------------------------------------------
// 动画
// --------------------------------------------------------------------------

// 下拉菜单动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 移动端菜单动画
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// 遮罩层动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
