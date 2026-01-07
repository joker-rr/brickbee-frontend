<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables';
import LogoIcon from '@/components/common/LogoIcon.vue';
import {
  validateEmail as validateEmailUtil,
  validatePassword as validatePasswordUtil,
  validateConfirmPassword as validateConfirmPasswordUtil,
  validateUsername as validateUsernameUtil,
  validateVerificationCode as validateVerificationCodeUtil,
} from '@/utils/validation';

// --------------------------------------------------------------------------
// 1. 使用 Composable
// --------------------------------------------------------------------------

/**
 * 使用认证 Composable
 * ✅ loading 和 error 由 useAuth 管理
 * ✅ register 和 sendRegisterCode 方法会自动处理逻辑
 */
const { register, sendRegisterCode, loading, error } = useAuth();
const router = useRouter();

/**
 * 表单数据
 */
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
});

/**
 * 表单验证错误
 */
const formErrors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
});

/**
 * 是否正在发送验证码
 */
const isSendingCode = ref(false);

/**
 * 验证码倒计时
 */
const countdown = ref(0);

/**
 * 是否可以发送验证码
 */
const canSendCode = computed(() => {
  return (
    !isSendingCode.value &&
    countdown.value === 0 &&
    formData.email &&
    !formErrors.email
  );
});

/**
 * 发送验证码按钮文字
 */
const sendCodeButtonText = computed(() => {
  if (isSendingCode.value) {
    return '发送中...';
  }
  if (countdown.value > 0) {
    return `${countdown.value}秒后重试`;
  }
  return '发送验证码';
});

// --------------------------------------------------------------------------
// 2. 表单验证
// --------------------------------------------------------------------------

/**
 * 验证用户名
 * ✅ 使用 Utils 的验证函数
 */
const validateUsername = (): boolean => {
  const result = validateUsernameUtil(formData.username, {
    minLength: 3,
    maxLength: 20,
    allowSpecialChars: false,
  });
  formErrors.username = result.message;
  return result.valid;
};

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
const validatePassword = (): boolean => {
  const result = validatePasswordUtil(formData.password, {
    minLength: 6,
    maxLength: 30,
  });
  formErrors.password = result.message;
  return result.valid;
};

/**
 * 验证确认密码
 * ✅ 使用 Utils 的验证函数
 */
const validateConfirmPassword = (): boolean => {
  const result = validateConfirmPasswordUtil(
    formData.password,
    formData.confirmPassword
  );
  formErrors.confirmPassword = result.message;
  return result.valid;
};

/**
 * 验证验证码
 * ✅ 使用 Utils 的验证函数
 */
const validateVerificationCode = (): boolean => {
  const result = validateVerificationCodeUtil(formData.verificationCode, 6);
  formErrors.verificationCode = result.message;
  return result.valid;
};

/**
 * 验证整个表单
 */
const validateForm = (): boolean => {
  const usernameValid = validateUsername();
  const emailValid = validateEmail();
  const passwordValid = validatePassword();
  const confirmPasswordValid = validateConfirmPassword();
  const verificationCodeValid = validateVerificationCode();

  return (
    usernameValid &&
    emailValid &&
    passwordValid &&
    confirmPasswordValid &&
    verificationCodeValid
  );
};

// --------------------------------------------------------------------------
// 3. 事件处理
// --------------------------------------------------------------------------

/**
 * 发送验证码
 * ✅ 使用 Composable 的 sendRegisterCode 方法
 * ✅ 发送验证码的 loading 用独立的 isSendingCode（不影响注册按钮）
 */
const sendVerificationCode = async () => {
  // 验证邮箱
  if (!validateEmail()) {
    return;
  }

  try {
    isSendingCode.value = true;

    // 调用 Composable 的方法发送验证码
    await sendRegisterCode({ email: formData.email });

    // 开始倒计时（60 秒）
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error: any) {
    // error 已经由 Composable 处理，这里只需要处理倒计时逻辑
  } finally {
    isSendingCode.value = false;
  }
};

/**
 * 处理注册
 * ✅ 使用 Composable 的 register 方法
 * ✅ 不需要手动管理 loading 和 error
 * ✅ 注册成功会自动跳转到登录页
 */
const handleRegister = async () => {
  // 验证表单
  if (!validateForm()) {
    return;
  }

  // 调用 Composable 的 register 方法
  // loading 会自动变为 true
  // 成功后会自动跳转到登录页
  // 失败后 error 会自动更新
  await register({
    username: formData.username,
    email: formData.email,
    password: formData.password,
    code: formData.verificationCode,
  });
};

/**
 * 跳转到登录页面
 */
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Logo -->
      <div class="logo">
        <LogoIcon :size="80" />
      </div>

      <!-- 标题 -->
      <h1 class="title">创建账号</h1>
      <p class="subtitle">加入 BrickBee</p>

      <!-- 错误消息 -->
      <div v-if="error" class="error-message">
        {{ error.message }}
      </div>

      <!-- 注册表单 -->
      <form class="register-form" @submit.prevent="handleRegister">
        <!-- 用户名 -->
        <div class="form-item">
          <label for="username">用户名</label>
          <input id="username" v-model="formData.username" type="text" placeholder="请输入用户名" autocomplete="username"
            @blur="validateUsername" />
          <span v-if="formErrors.username" class="field-error">{{
            formErrors.username
          }}</span>
        </div>

        <!-- 邮箱 -->
        <div class="form-item">
          <label for="email">邮箱</label>
          <input id="email" v-model="formData.email" type="email" placeholder="请输入邮箱" autocomplete="email"
            @blur="validateEmail" />
          <span v-if="formErrors.email" class="field-error">{{
            formErrors.email
          }}</span>
        </div>

        <!-- 验证码 -->
        <div class="form-item">
          <label for="verificationCode">验证码</label>
          <div class="code-input-group">
            <input id="verificationCode" v-model="formData.verificationCode" type="text" placeholder="请输入验证码"
              maxlength="6" @blur="validateVerificationCode" />
            <button type="button" class="send-code-button" :disabled="!canSendCode" @click="sendVerificationCode">
              {{ sendCodeButtonText }}
            </button>
          </div>
          <span v-if="formErrors.verificationCode" class="field-error">{{
            formErrors.verificationCode
          }}</span>
        </div>

        <!-- 密码 -->
        <div class="form-item">
          <label for="password">密码</label>
          <input id="password" v-model="formData.password" type="password" placeholder="请输入密码"
            autocomplete="new-password" @blur="validatePassword" />
          <span v-if="formErrors.password" class="field-error">{{
            formErrors.password
          }}</span>
        </div>

        <!-- 确认密码 -->
        <div class="form-item">
          <label for="confirmPassword">确认密码</label>
          <input id="confirmPassword" v-model="formData.confirmPassword" type="password" placeholder="请再次输入密码"
            autocomplete="new-password" @blur="validateConfirmPassword" />
          <span v-if="formErrors.confirmPassword" class="field-error">{{
            formErrors.confirmPassword
          }}</span>
        </div>

        <!-- 注册按钮 -->
        <button type="submit" class="submit-button" :disabled="loading">
          <span v-if="loading">注册中...</span>
          <span v-else>注册</span>
        </button>
      </form>

      <!-- 登录链接 -->
      <div class="login-link">
        已有账号?
        <button type="button" class="link-button" @click="goToLogin">
          立即登录
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.register-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-container {
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

.register-form {
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

    .code-input-group {
      display: flex;
      gap: 8px;

      input {
        flex: 1;
      }

      .send-code-button {
        padding: 12px 16px;
        font-size: 14px;
        color: white;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity 0.2s ease;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
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
    margin-top: 8px;

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

.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;

  .link-button {
    margin-left: 8px;
  }
}
</style>
