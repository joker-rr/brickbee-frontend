/**
 * ============================================================================
 * 文件名：index.ts
 * 位置：src/api/index.ts
 * 作用：统一导出所有 API 模块
 * 为什么需要：方便在组件中导入 API
 * ============================================================================
 */

// HTTP 客户端
export { httpClient, request } from './client'

// API 类型


// 新架构的 API 模块（优先使用）
export { userApi } from './modules/auth'
export { itemsApi } from './modules/items'
export { systemApi } from './modules/system'
export { platformApi } from './modules/platform'

// 导出类型
export type {
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
} from './modules/auth/types'

export type {
  SteamItem,
  FilterOption,
  ItemListParams,
  ItemListResponse,
  ItemDetailParams,
  BatchItemParams
} from './modules/items/types'

// 兼容旧的导出（保持向后兼容，将逐步废弃）

export * from './common'

// TODO: 逐步迁移到新架构
// export * from './modules/platform'
// export * from './modules/steam'

/**
 * ============================================================================
 * 使用说明
 * ============================================================================
 * 
 * 在组件中导入：
 * 
 * 方式1: 导入特定的 API
 * import { userApi, systemApi } from '@/api';
 * 
 * 方式2: 导入所有 API（不推荐，会增加打包体积）
 * import * as api from '@/api';
 * 
 * 方式3: 按需导入类型
 * import { userApi, type User, type LoginParams } from '@/api';
 * 
 * ============================================================================
 */

/**
 * ============================================================================
 * 在组件中的完整使用示例
 * ============================================================================
 */

/*
// Login.vue - 登录页面

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { userApi, type LoginParams } from '@/api';

const router = useRouter();

// 表单数据
const loginForm = ref<LoginParams>({
  username: '',
  password: '',
});

// 登录加载状态
const loading = ref(false);

// 处理登录
const handleLogin = async () => {
  // 验证表单
  if (!loginForm.value.username || !loginForm.value.password) {
    alert('请输入用户名和密码');
    return;
  }

  loading.value = true;
  
  try {
    // 调用登录接口
    const result = await userApi.login(loginForm.value);
    
    // 登录成功
    logger.log('✅ 登录成功');
    logger.log('Token:', result.token);
    logger.log('用户:', result.user);
    
    // 跳转到首页
    router.push('/');
  } catch (error: any) {
    // 登录失败（错误已经被全局错误处理器处理了）
    logger.error('❌ 登录失败:', error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <h1>登录</h1>
    
    <form @submit.prevent="handleLogin">
      <input
        v-model="loginForm.username"
        type="text"
        placeholder="用户名"
      />
      
      <input
        v-model="loginForm.password"
        type="password"
        placeholder="密码"
      />
      
      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>
*/

/*
// UserList.vue - 用户列表页面

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userApi, type User } from '@/api';

// 用户列表
const users = ref<User[]>([]);
// 总数
const total = ref(0);
// 加载状态
const loading = ref(false);
// 分页参数
const pagination = ref({
  page: 1,
  pageSize: 10,
});

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  
  try {
    const result = await userApi.getUserList(pagination.value);
    
    users.value = result.list;
    total.value = result.total;
    
    logger.log(`✅ 加载了 ${result.list.length} 个用户`);
  } catch (error) {
    logger.error('❌ 加载用户列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 删除用户
const handleDelete = async (id: number) => {
  if (!confirm('确定要删除该用户吗？')) {
    return;
  }

  try {
    await userApi.deleteUser(id);
    
    logger.log('✅ 删除成功');
    
    // 刷新列表
    await fetchUsers();
  } catch (error) {
    logger.error('❌ 删除失败:', error);
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="user-list">
    <h1>用户列表 (共 {{ total }} 人)</h1>
    
    <div v-if="loading">加载中...</div>
    
    <div v-else>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button @click="handleDelete(user.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
*/

/*
// Home.vue - 首页（检查后端连接）

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { systemApi } from '@/api';

const backendStatus = ref<'success' | 'error' | 'checking'>('checking');
const backendMessage = ref('');

// 检查后端连接
const checkBackend = async () => {
  try {
    const response = await systemApi.healthCheck();
    
    backendStatus.value = 'success';
    backendMessage.value = response.data.message || '后端连接成功';
    
    logger.log('✅ 后端连接成功');
  } catch (error: any) {
    backendStatus.value = 'error';
    backendMessage.value = '后端连接失败: ' + error.message;
    
    logger.error('❌ 后端连接失败:', error);
  }
};

onMounted(() => {
  checkBackend();
});
</script>

<template>
  <div class="home">
    <h1>首页</h1>
    
    <div class="backend-status">
      <div v-if="backendStatus === 'checking'">
        🔄 检查后端连接中...
      </div>
      <div v-else-if="backendStatus === 'success'" style="color: green;">
        ✅ {{ backendMessage }}
      </div>
      <div v-else style="color: red;">
        ❌ {{ backendMessage }}
      </div>
    </div>
  </div>
</template>
*/