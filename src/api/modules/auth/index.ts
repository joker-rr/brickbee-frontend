/*
 * @Author: joker.rrr
 * @Date: 2025-12-02 22:00:25
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-12 14:58:15
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\modules\auth\index.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

/**
 * ============================================================================
 * 文件名：user.ts
 * 位置：src/api/modules/user.ts
 * 作用：定义所有用户相关的 API 接口
 * 为什么需要：
 *   1. 集中管理接口
 *   2. 方便维护和修改
 *   3. 提供类型提示
 * ============================================================================
 */

import { request } from '@/api/client'

import type {
  User,
  LoginParams,
  LoginResponse,
  RegisterParams,
  RegisterResponse,
  SendRegisterCodeParams,
  SendResetPasswordCodeParams,
  ResetPasswordParams,
  ChangePasswordParams,
  RefreshTokenParams,
  RefreshTokenResponse,
  UserListParams,
  UserListResponse
} from './types'

import { API_PREFIX, AUTH_ROUTES } from '../../common'


// --------------------------------------------------------------------------
// 2. 定义 API 接口
// --------------------------------------------------------------------------

/**
 * 用户相关 API
 */
export const userApi = {
  /**
   * 登录
   *
   * @param data - 登录参数
   * @returns 登录响应（包含 Token 和用户信息）
   *
   * 使用示例：
   * const result = await userApi.login({ username: 'admin', password: '123456' });
   * logge.log(result.token);
   * logge.log(result.user.name);
   */
  login: (data: LoginParams) =>
    request.post<LoginResponse>(`${API_PREFIX.AUTH}${AUTH_ROUTES.LOGIN}`, data, {
      needToken: false,  // 登录接口不需要 Token
      showLoading: true,
    }),

  /**
   * 注册
   *
   * @param data - 注册参数
   * @returns 注册响应（包含 Token 和用户信息）
   *
   * 使用示例：
   * const result = await userApi.register({
   *   username: 'newuser',
   *   password: '123456',
   *   email: 'newuser@example.com',
   *   verificationCode: '123456',
   * });
   */
  register: (data: RegisterParams) =>
    request.post<RegisterResponse>(`${API_PREFIX.AUTH}${AUTH_ROUTES.REGISTER}`, data, {
      needToken: false,
      showLoading: true,
    }),

  /**
   * 修改密码
   *
   * @param data - 密码信息
   *
   * 使用示例：
   * await userApi.changePassword({
   *   oldPassword: '123456',
   *   newPassword: '654321',
   * });
   */
  changePassword: (data: ChangePasswordParams) =>
    request.post(`${API_PREFIX.AUTH}${AUTH_ROUTES.CHANGE_PASSWORD}`, data),

  /**
   * 发送注册验证码
   *
   * @param data - 邮箱地址
   *
   * 使用示例：
   * await userApi.sendRegisterCode({ email: 'user@example.com' });
   */
  sendRegisterCode: (data: SendRegisterCodeParams) =>
    request.post(`${API_PREFIX.AUTH}${AUTH_ROUTES.SEND_REGISTER_CODE}`, data, {
      needToken: false,
      showLoading: false,  // 不显示 Loading，避免频繁闪烁
    }),

  /**
   * 发送重置密码验证码
   *
   * @param data - 邮箱地址
   *
   * 使用示例：
   * await userApi.sendResetPasswordCode({ email: 'user@example.com' });
   */
  sendResetPasswordCode: (data: SendResetPasswordCodeParams) =>
    request.post(`${API_PREFIX.AUTH}${AUTH_ROUTES.SEND_RESET_PASSWORD_CODE}`, data, {
      needToken: false,
      showLoading: false,
    }),

  /**
   * 重置密码
   *
   * @param data - 重置密码参数
   *
   * 使用示例：
   * await userApi.resetPassword({
   *   email: 'user@example.com',
   *   verificationCode: '123456',
   *   newPassword: 'newpassword123',
   * });
   */
  resetPassword: (data: ResetPasswordParams) =>
    request.post(`${API_PREFIX.AUTH}${AUTH_ROUTES.RESET_PASSWORD}`, data, {
      needToken: false,
      showLoading: true,
    }),

  /**
   * 刷新 Token
   *
   * @param data - 刷新 Token 参数
   * @returns 新的 Token
   *
   * 使用示例：
   * const result = await userApi.refreshToken({ refreshToken: 'xxx' });
   * logge.log(result.token);
   */
  refreshToken: (data: RefreshTokenParams) =>
    request.post<RefreshTokenResponse>(`${API_PREFIX.AUTH}${AUTH_ROUTES.REFRESH_TOKEN}`, data, {
      needToken: false,
      showLoading: false,
    }),

  /**
   * 登出
   *
   * 使用示例：
   * await userApi.logout();
   */
  logout: () =>
    request.post(`${API_PREFIX.AUTH}${AUTH_ROUTES.LOGOUT}`, {}, {
      showLoading: false,
    }),

  /**
   * 获取当前登录用户信息
   * 
   * @returns 用户信息
   * 
   * 使用示例：
   * const user = await userApi.getCurrentUser();
   * logge.log(user.name);
   */
  getCurrentUser: () =>
    request.get<User>(`${API_PREFIX.AUTH}${AUTH_ROUTES.LOGIN}`),

  /**
   * 获取用户列表
   * 
   * @param params - 查询参数
   * @returns 用户列表
   * 
   * 使用示例：
   * const result = await userApi.getUserList({
   *   page: 1,
   *   pageSize: 10,
   *   keyword: '张三',
   * });
   * logge.log(result.total);
   * logge.log(result.list);
   */
  getUserList: (params?: UserListParams) =>
    request.get<UserListResponse>(`${API_PREFIX.AUTH}${AUTH_ROUTES.LOGIN}`, { params }),

  /**
   * 获取用户详情
   * 
   * @param id - 用户 ID
   * @returns 用户信息
   * 
   * 使用示例：
   * const user = await userApi.getUserById(1);
   */
  getUserById: (id: number) =>
    request.get<User>(`/users/${id}`),

  /**
   * 创建用户
   * 
   * @param data - 用户信息
   * @returns 创建的用户
   * 
   * 使用示例：
   * const newUser = await userApi.createUser({
   *   username: 'zhangsan',
   *   name: '张三',
   *   email: 'zhangsan@example.com',
   *   role: 'user',
   * });
   */
  createUser: (data: Partial<User>) =>
    request.post<User>(`${API_PREFIX.AUTH}${AUTH_ROUTES.LOGIN}`, data),

  /**
   * 更新用户信息
   * 
   * @param id - 用户 ID
   * @param data - 要更新的字段
   * @returns 更新后的用户
   * 
   * 使用示例：
   * const updatedUser = await userApi.updateUser(1, {
   *   name: '李四',
   *   email: 'lisi@example.com',
   * });
   */
  updateUser: (id: number, data: Partial<User>) =>
    request.put<User>(`/users/${id}`, data),

  /**
   * 删除用户
   * 
   * @param id - 用户 ID
   * 
   * 使用示例：
   * await userApi.deleteUser(1);
   */
  deleteUser: (id: number) =>
    request.delete(`/users/${id}`),



  /**
   * 上传头像
   * 
   * @param file - 头像文件
   * @returns 头像 URL
   * 
   * 使用示例：
   * const file = event.target.files[0];
   * const avatarUrl = await userApi.uploadAvatar(file);
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return request.post<string>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

/**
 * ============================================================================
 * 完整使用示例
 * ============================================================================
 */

/*
// 在 Vue 组件中使用

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userApi, type User } from '@/api/modules/user';

// 响应式数据
const users = ref<User[]>([]);
const loading = ref(false);
const currentUser = ref<User | null>(null);

// 获取当前用户
const fetchCurrentUser = async () => {
  try {
    const user = await userApi.getCurrentUser();
    currentUser.value = user;
    logge.log('当前用户:', user.name);
  } catch (error) {
    logge.error('获取用户信息失败:', error);
  }
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const result = await userApi.getUserList({
      page: 1,
      pageSize: 10,
    });
    
    users.value = result.list;
    logge.log('用户总数:', result.total);
  } catch (error) {
    logge.error('获取用户列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 删除用户
const deleteUser = async (id: number) => {
  if (!confirm('确定要删除该用户吗？')) {
    return;
  }
  
  try {
    await userApi.deleteUser(id);
    logge.log('删除成功');
    
    // 刷新列表
    await fetchUsers();
  } catch (error) {
    logge.error('删除失败:', error);
  }
};

// 登录
const handleLogin = async (username: string, password: string) => {
  try {
    const result = await userApi.login({ username, password });
    
    // 保存 Token（已经在拦截器中自动处理了）
    logge.log('登录成功:', result.user.name);
    
    // 跳转到首页
    router.push('/');
  } catch (error) {
    logge.error('登录失败:', error);
  }
};

// 页面加载时执行
onMounted(() => {
  fetchCurrentUser();
  fetchUsers();
});
</script>

<template>
  <div>
    <div v-if="currentUser">
      当前用户: {{ currentUser.name }}
    </div>
    
    <div v-if="loading">加载中...</div>
    
    <div v-else>
      <div v-for="user in users" :key="user.id">
        {{ user.name }}
        <button @click="deleteUser(user.id)">删除</button>
      </div>
    </div>
  </div>
</template>
*/