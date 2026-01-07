/**
 * ============================================================================
 * 文件名：user.ts
 * 位置：src/stores/modules/user.ts
 * 作用：管理用户状态（登录态、用户信息等）
 * 为什么需要：
 *   1. 全局管理用户信息
 *   2. 多个页面共享登录状态
 *   3. 统一处理登录、登出逻辑
 * ============================================================================
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userApi } from '@/api';
import type {
    User,
    LoginParams,
    RegisterParams,
    ChangePasswordParams,
    ResetPasswordParams,
    SendRegisterCodeParams,
    SendResetPasswordCodeParams,
} from '@/api';
import { tokenManager } from '@/utils/http/tokenManager';
import { logger } from '@/utils/logger';


//临时生成头像
import { generateAvatarByDiceBear } from '@/utils/temporaryAvatar';
/**
 * 用户 Store
 *
 * 使用 Composition API 风格（推荐）
 */
export const useUserStore = defineStore('user', () => {
    // --------------------------------------------------------------------------
    // 1. State（状态）
    // --------------------------------------------------------------------------

    /**
     * 当前登录用户信息
     */
    const userInfo = ref<User | null>(null);

    /**
     * 是否已登录
     */
    const isLoggedIn = computed(() => !!userInfo.value && !!tokenManager.getToken());

    /**
     * 用户角色
     */
    const userRole = computed(() => userInfo.value?.role || '');

    /**
     * 用户名
     */
    const nickname = computed(() => userInfo.value?.nickname || '');

    /**
     * 用户显示名称
     */
    const displayName = computed(() => userInfo.value?.name || userInfo.value?.nickname || '未登录');

    // --------------------------------------------------------------------------
    // 2. Actions（操作）
    // --------------------------------------------------------------------------

    /**
     * 登录
     *
     * @param params - 登录参数
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.login({ email: 'admin', password: '123456' });
     */
    const login = async (params: LoginParams): Promise<void> => {
        try {
            logger.log('用户登录:', params.email);

            // 调用登录接口
            const response = await userApi.login(params);

            // 保存 Token
            tokenManager.setToken(response.accessToken);

            //临时头像
            const avatar = generateAvatarByDiceBear();
            response.user.avatar = avatar

            // 保存用户信息
            userInfo.value = response.user;

            logger.log('登录成功:', response.user.nickname);
        } catch (error) {
            logger.error('登录失败:', error);
            throw error;
        }
    };

    /**
     * 注册
     *
     * @param params - 注册参数
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.register({
     *   nickname: 'newuser',
     *   password: '123456',
     *   email: 'newuser@example.com',
     *   verificationCode: '123456',
     * });
     */
    const register = async (params: RegisterParams): Promise<void> => {
        try {


            // 调用注册接口
            const response = await userApi.register(params);

            logger.log('注册成功:', response.email);
        } catch (error) {
            logger.error('注册失败:', error);
            throw error;
        }
    };

    /**
     * 发送注册验证码
     *
     * @param params - 邮箱地址
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.sendRegisterCode({ email: 'user@example.com' });
     */
    const sendRegisterCode = async (params: SendRegisterCodeParams): Promise<void> => {
        try {
            logger.log('发送注册验证码:', params.email);
            await userApi.sendRegisterCode(params);
            logger.log('验证码已发送');
        } catch (error) {
            logger.error('发送验证码失败:', error);
            throw error;
        }
    };

    /**
     * 发送重置密码验证码
     *
     * @param params - 邮箱地址
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.sendResetPasswordCode({ email: 'user@example.com' });
     */
    const sendResetPasswordCode = async (params: SendResetPasswordCodeParams): Promise<void> => {
        try {
            logger.log('发送重置密码验证码:', params.email);
            await userApi.sendResetPasswordCode(params);
            logger.log('验证码已发送');
        } catch (error) {
            logger.error('发送验证码失败:', error);
            throw error;
        }
    };

    /**
     * 重置密码
     *
     * @param params - 重置密码参数
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.resetPassword({
     *   email: 'user@example.com',
     *   verificationCode: '123456',
     *   newPassword: 'newpassword123',
     * });
     */
    const resetPassword = async (params: ResetPasswordParams): Promise<void> => {
        try {
            logger.log('重置密码:', params.email);
            await userApi.resetPassword(params);
            logger.log('密码重置成功');
        } catch (error) {
            logger.error('重置密码失败:', error);
            throw error;
        }
    };

    /**
     * 修改密码
     *
     * @param params - 修改密码参数
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.changePassword({
     *   oldPassword: '123456',
     *   newPassword: '654321',
     * });
     */
    const changePassword = async (params: ChangePasswordParams): Promise<void> => {
        try {
            logger.log('修改密码');
            await userApi.changePassword(params);
            logger.log('密码修改成功');
        } catch (error) {
            logger.error('修改密码失败:', error);
            throw error;
        }
    };

    /**
     * 登出
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.logout();
     */
    const logout = async (): Promise<void> => {
        try {
            logger.log('用户登出');

            // 调用登出接口
            await userApi.logout();

            // 清除 Token
            tokenManager.clearTokens();

            // 清除用户信息
            userInfo.value = null;

            logger.log('登出成功');
        } catch (error) {
            logger.error('登出失败:', error);

            // 即使登出失败，也清除本地数据
            tokenManager.clearTokens();
            userInfo.value = null;

            throw error;
        }
    };

    /**
     * 获取当前用户信息
     *
     * 使用场景：
     * 1. 页面刷新后恢复用户信息
     * 2. Token 存在但用户信息丢失时
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.fetchUserInfo();
     */
    const fetchUserInfo = async (): Promise<void> => {
        try {
            // 如果没有 Token，直接返回
            if (!tokenManager.getToken()) {
                logger.log('未登录，跳过获取用户信息');
                return;
            }

            logger.log('获取用户信息');

            // 调用接口获取用户信息
            const user = await userApi.getCurrentUser();

            // 保存用户信息
            userInfo.value = user;

            logger.log('用户信息获取成功:', user.nickname);
        } catch (error) {
            logger.error('获取用户信息失败:', error);

            // 如果是 401 错误，清除本地数据
            if ((error as any)?.response?.status === 401) {
                tokenManager.clearTokens();
                userInfo.value = null;
            }

            throw error;
        }
    };

    /**
     * 初始化用户状态
     *
     * 使用场景：应用启动时调用
     *
     * 工作流程：
     * 1. 检查本地是否有 Token
     * 2. 如果有，获取用户信息
     * 3. 如果没有，不做任何操作
     *
     * 使用示例：
     * const userStore = useUserStore();
     * await userStore.initUserState();
     */
    const initUserState = async (): Promise<void> => {
        try {
            logger.log('初始化用户状态');

            // 如果有 Token，获取用户信息
            if (tokenManager.getToken()) {
                await fetchUserInfo();
            }

            logger.log('用户状态初始化完成');
        } catch (error) {
            logger.error('用户状态初始化失败:', error);
            // 初始化失败不抛出错误，允许应用继续运行
        }
    };

    /**
     * 初始化认证状态（刷新 Token + 获取用户信息）
     *
     * 使用场景：应用启动时调用（推荐使用这个而不是 initUserState）
     *
     * 工作流程：
     * 1. 先读取本地缓存的用户信息（快速显示）
     * 2. 尝试刷新 Token（验证用户是否仍然登录）
     * 3. 刷新成功后，重新获取最新用户信息
     * 4. 将最新用户信息缓存到本地
     * 5. 如果刷新失败，清除用户状态
     *
     * 使用示例：
     * // 在 App.vue 中
     * const userStore = useUserStore();
     * await userStore.initializeAuth();
     */
    const initializeAuth = async (): Promise<void> => {
        try {
            logger.log('🚀 开始初始化认证状态...');

            // ========================================
            // 步骤1: 尝试刷新 Token（验证登录状态）
            // ========================================
            try {
                const user = await tokenManager.refreshToken(true);
                userInfo.value = JSON.parse(user)
                logger.log('✅ Token 刷新成功，用户仍处于登录状态');
            } catch (error) {
                // Token 刷新失败，说明用户已登出或 Token 过期
                logger.log('⚠️ Token 刷新失败，清除用户状态');
                clearUserState();
                return;
            }


            logger.log('🎉 认证状态初始化完成');
        } catch (error) {
            logger.error('❌ 认证状态初始化失败:', error);
            clearUserState();
        }
    };

    /**
     * 清除用户状态
     *
     * 使用场景：
     * 1. 登出时
     * 2. Token 失效时
     * 3. 初始化失败时
     */
    const clearUserState = (): void => {
        userInfo.value = null;
        tokenManager.clearTokens();
        logger.log('🧹 用户状态已清除');
    };























    // --------------------------------------------------------------------------
    // 3. 返回（暴露给外部使用）
    // --------------------------------------------------------------------------

    return {
        // State
        userInfo,
        isLoggedIn,
        userRole,
        nickname,
        displayName,

        // Actions
        login,
        register,
        sendRegisterCode,
        sendResetPasswordCode,
        resetPassword,
        changePassword,
        logout,
        fetchUserInfo,
        initUserState,
        initializeAuth,
        clearUserState,
    };
});




// --------------------------------------------------------------------------
// 使用示例
// --------------------------------------------------------------------------

/*
// 在 Vue 组件中使用

<script setup lang="ts">
import { useUserStore } from '@/stores/modules/user';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

// 登录
const handleLogin = async () => {
  try {
    await userStore.login({
      nickname: 'admin',
      password: '123456',
    });

    // 登录成功，跳转到首页
    router.push('/');
  } catch (error) {
    logger.error('登录失败:', error);
  }
};

// 登出
const handleLogout = async () => {
  try {
    await userStore.logout();

    // 登出成功，跳转到登录页
    router.push('/login');
  } catch (error) {
    logger.error('登出失败:', error);
  }
};

// 获取用户信息
logger.log('当前用户:', userStore.displayName);
logger.log('是否登录:', userStore.isLoggedIn);
logger.log('用户角色:', userStore.userRole);
</script>

<template>
  <div>
    <div v-if="userStore.isLoggedIn">
      欢迎, {{ userStore.displayName }}
      <button @click="handleLogout">登出</button>
    </div>
    <div v-else>
      <button @click="handleLogin">登录</button>
    </div>
  </div>
</template>
*/

// --------------------------------------------------------------------------
// 在 main.ts 中初始化用户状态
// --------------------------------------------------------------------------

/*
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useUserStore } from '@/stores/modules/user';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// 初始化用户状态
const userStore = useUserStore();
userStore.initUserState().then(() => {
  app.mount('#app');
});
*/
