import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { tokenManager } from '@/utils/http/tokenManager';
import { toast } from '@/utils/toast';

/**
 * 扩展路由 meta 类型
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean; // 是否需要登录
    guestOnly?: boolean; // 只允许未登录用户访问（如登录页、注册页）
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
    meta: {
      title: '首页',
      requiresAuth: false, // 首页不需要登录
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      guestOnly: true, // 只允许未登录用户访问
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: {
      title: '注册',
      guestOnly: true,
    },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/reset-password/index.vue'),
    meta: {
      title: '重置密码',
      guestOnly: true,
    },
  },
  {
    path: '/items',
    name: 'Items',
    component: () => import('@/views/items/index.vue'),
    meta: {
      title: 'Steam 饰品列表',
      requiresAuth: false, // 物品列表不需要登录
    },
  },
  {
    path: '/components-demo',
    name: 'ComponentsDemo',
    component: () => import('@/views/components-demo/index.vue'),
    meta: {
      title: '组件演示',
      requiresAuth: false,
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true, // 需要登录才能访问
    },
  },
  {
    path: '/platform-center',
    name: 'PlatformCenter',
    component: () => import('@/views/platform-center/index.vue'),
    meta: {
      title: '平台中心',
      requiresAuth: true, // 需要登录才能访问
    },
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --------------------------------------------------------------------------
// 路由守卫
// --------------------------------------------------------------------------

/**
 * 全局前置守卫
 *
 * 功能：
 * 1. 设置页面标题
 * 2. 检查登录状态
 * 3. 处理需要登录的页面
 * 4. 处理只允许未登录访问的页面（如登录页）
 */
router.beforeEach((to, _from, next) => {
  // 1. 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE}`;
  }
  // 2. 检查是否有 Token
  const hasToken = tokenManager.getToken();

  // 3. 如果页面需要登录，但用户未登录
  if (to.meta.requiresAuth && !hasToken) {
    // 跳转到登录页，并保存原始目标路径
    toast.warning('请先登录')
    next({
      path: '/login',
      query: {
        redirect: to.fullPath, // 登录后跳转回原页面
      },
    });
    return;
  }

  // 4. 如果页面只允许未登录访问（如登录页），但用户已登录
  if (to.meta.guestOnly && hasToken) {
    toast.error('未知错误')
    // 跳转到首页
    next('/');
    return;
  }

  // 5. 允许访问
  next();
});

/**
 * 全局后置守卫
 *
 * 功能：
 * 1. 页面切换后滚动到顶部
 */
router.afterEach(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0);
});

export default router;
