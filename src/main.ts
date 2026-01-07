/*
 * @Author: joker.rrr 
 * @Date: 2025-11-30 10:44:55
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-13 06:58:20
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\main.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './assets/styles/global.scss';
import { useUserStore } from '@/stores/modules/user';


// 创建应用实例
const app = createApp(App);

// 注册插件（必须在使用 store 之前）
app.use(createPinia());


// ✅ 初始化认证状态（刷新 Token + 获取用户信息）
const userStore = useUserStore();

(async () => {
    try {


        // 初始化用户认证状态
        await userStore.initializeAuth();

        app.use(router);
        // 挂载应用
        app.mount('#app');
    } catch (error) {
        console.error('应用初始化失败:', error);

        // 即使初始化失败，也要挂载应用
        app.mount('#app');
    }
})();
