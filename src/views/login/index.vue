<!--
 * @Author: joker.rrr 
 * @Date: 2025-12-12 20:27:18
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-13 20:17:51
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\views\login\index.vue
 * @Description:登录页面
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables';
import LogoIcon from '@/components/common/LogoIcon.vue';
import {
  validateEmail as validateEmailUtil,
  // validatePassword as validatePasswordUtil
} from '@/utils/validation';

// --------------------------------------------------------------------------
// 1. 使用 Composable
// --------------------------------------------------------------------------

/**
 * 使用认证 Composable
 * ✅ loading 和 error 由 useAuth 管理，不需要自己定义
 * ✅ login 方法会自动处理跳转逻辑
 */
const { login, loading, error } = useAuth();
const router = useRouter();

/**
 * 表单数据
 */
const formData = reactive({
  email: '',
  password: '',
});

/**
 * 表单验证错误
 */
const formErrors = reactive({
  email: '',
  password: '',
});

// --------------------------------------------------------------------------
// 2. 表单验证
// --------------------------------------------------------------------------

/**
 * 验证邮箱
 * ✅ 使用 Utils 的验证函数
 */
const validateEmail = (): boolean => {
  const result = validateEmailUtil(formData.email);
  formErrors.email = result.message;
  return result.valid;
};

/**
 * 验证密码
 * ✅ 使用 Utils 的验证函数
 */
// const validatePassword = (): boolean => {
//   const result = validatePasswordUtil(formData.password, {
//     minLength: 6,
//     maxLength: 30,
//   });
//   formErrors.password = result.message;
//   return result.valid;
// };

/**
 * 验证整个表单
 */
const validateForm = (): boolean => {
  const emailValid = validateEmail();
  // const passwordValid = validatePassword();

  return emailValid;
};

// --------------------------------------------------------------------------
// 3. 事件处理
// --------------------------------------------------------------------------

/**
 * 处理登录
 * ✅ 使用 Composable 的 login 方法
 * ✅ 不需要手动管理 loading 和 error
 * ✅ 不需要手动跳转（login 方法内部已处理）
 */
const handleLogin = async () => {
  // 验证表单
  if (!validateForm()) {
    return;
  }

  // 调用 Composable 的 login 方法
  // loading 会自动变为 true
  // 成功后会自动跳转到首页
  // 失败后 error 会自动更新
  await login({
    email: formData.email,
    password: formData.password,
  });
};

/**
 * 跳转到注册页面
 */
const goToRegister = () => {
  router.push('/register');
};

/**
 * 跳转到忘记密码页面
 */
const goToResetPassword = () => {
  router.push('/reset-password');
};
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo -->
      <div class="logo">
        <LogoIcon :size="80" />
      </div>

      <!-- 标题 -->
      <h1 class="title">欢迎回来</h1>
      <p class="subtitle">登录到 BrickBee</p>

      <!-- 错误消息 -->
      <div v-if="error" class="error-message">
        {{ error.message }}
      </div>

      <!-- 登录表单 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <!-- 邮箱 -->
        <div class="form-item">
          <label for="email">邮箱</label>
          <input id="email" v-model="formData.email" type="text" placeholder="请输入邮箱" autocomplete="username"
            @blur="validateEmail" />
          <span v-if="formErrors.email" class="field-error">{{
            formErrors.email
            }}</span>
        </div>

        <!-- 密码 -->
        <div class="form-item">
          <label for="password">密码</label>
          <input id="password" v-model="formData.password" type="password" placeholder="请输入密码"
            autocomplete="current-password" />
          <span v-if="formErrors.password" class="field-error">{{
            formErrors.password
            }}</span>
        </div>

        <!-- 忘记密码 -->
        <div class="form-actions">
          <button type="button" class="link-button" @click="goToResetPassword">
            忘记密码?
          </button>
        </div>

        <!-- 登录按钮 -->
        <button type="submit" class="submit-button" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登录</span>
        </button>
      </form>

      <!-- 注册链接 -->
      <div class="register-link">
        还没有账号?
        <button type="button" class="link-button" @click="goToRegister">
          立即注册
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;

  svg {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }
}

.title {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.subtitle {
  font-size: 14px;
  text-align: center;
  color: #666;
  margin-bottom: 32px;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  text-align: center;
}

.login-form {
  .form-item {
    margin-bottom: 20px;

    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    input {
      width: 100%;
      padding: 12px 16px;
      font-size: 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: #667eea;
      }

      &::placeholder {
        color: #999;
      }
    }

    .field-error {
      display: block;
      color: #f56c6c;
      font-size: 12px;
      margin-top: 6px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
  }

  .submit-button {
    width: 100%;
    padding: 14px;
    font-size: 16px;
    font-weight: 500;
    color: white;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #764ba2;
    text-decoration: underline;
  }
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;

  .link-button {
    margin-left: 8px;
  }
}
</style>
