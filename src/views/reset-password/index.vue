<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables';
import LogoIcon from '@/components/common/LogoIcon.vue';
import {
  validateEmail as validateEmailUtil,
  validatePassword as validatePasswordUtil,
  validateConfirmPassword as validateConfirmPasswordUtil,
  validateVerificationCode as validateVerificationCodeUtil,
} from '@/utils/validation';

// --------------------------------------------------------------------------
// 1. 使用 Composable
// --------------------------------------------------------------------------

/**
 * 使用认证 Composable
 * ✅ loading 和 error 由 useAuth 管理
 * ✅ sendResetPasswordCode 和 resetPassword 方法会自动处理逻辑
 */
const { sendResetPasswordCode, resetPassword, loading, error } = useAuth();
const router = useRouter();

/**
 * 表单数据
 */
const formData = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '',
});

/**
 * 表单验证错误
 */
const formErrors = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '',
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
 * 成功消息
 */
const successMessage = ref('');

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
 * 验证邮箱
 * ✅ 使用 Utils 的验证函数
 */
const validateEmail = (): boolean => {
  const result = validateEmailUtil(formData.email);
  formErrors.email = result.message;
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
 * 验证新密码
 * ✅ 使用 Utils 的验证函数
 */
const validateNewPassword = (): boolean => {
  const result = validatePasswordUtil(formData.newPassword, {
    minLength: 6,
    maxLength: 30,
  });
  formErrors.newPassword = result.message;
  return result.valid;
};

/**
 * 验证确认密码
 * ✅ 使用 Utils 的验证函数
 */
const validateConfirmPassword = (): boolean => {
  const result = validateConfirmPasswordUtil(
    formData.newPassword,
    formData.confirmPassword
  );
  formErrors.confirmPassword = result.message;
  return result.valid;
};

/**
 * 验证整个表单
 */
const validateForm = (): boolean => {
  const emailValid = validateEmail();
  const verificationCodeValid = validateVerificationCode();
  const newPasswordValid = validateNewPassword();
  const confirmPasswordValid = validateConfirmPassword();

  return (
    emailValid &&
    verificationCodeValid &&
    newPasswordValid &&
    confirmPasswordValid
  );
};

// --------------------------------------------------------------------------
// 3. 事件处理
// --------------------------------------------------------------------------

/**
 * 发送验证码
 * ✅ 使用 Composable 的 sendResetPasswordCode 方法
 * ✅ 发送验证码的 loading 用独立的 isSendingCode（不影响重置按钮）
 */
const sendVerificationCode = async () => {
  // 验证邮箱
  if (!validateEmail()) {
    return;
  }

  try {
    isSendingCode.value = true;

    // 调用 Composable 的方法发送验证码
    await sendResetPasswordCode({ email: formData.email });

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
 * 处理重置密码
 * ✅ 使用 Composable 的 resetPassword 方法
 * ✅ 不需要手动管理 loading 和 error
 * ✅ 重置成功后显示成功消息并跳转
 */
const handleResetPassword = async () => {
  // 清除之前的成功消息
  successMessage.value = '';

  // 验证表单
  if (!validateForm()) {
    return;
  }

  try {
    // 调用 Composable 的 resetPassword 方法
    await resetPassword({
      email: formData.email,
      code: formData.verificationCode,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });

    // 显示成功消息
    successMessage.value = '密码重置成功！3 秒后跳转到登录页面...';

    // 3 秒后跳转到登录页面
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (error: any) {
    // error 已经由 Composable 处理
  }
};

/**
 * 跳转到登录页面
 */
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="reset-password-page">
    <div class="reset-password-container">
      <!-- Logo -->
      <div class="logo">
        <LogoIcon :size="80" />
      </div>

      <!-- 标题 -->
      <h1 class="title">重置密码</h1>
      <p class="subtitle">找回您的 BrickBee 账号</p>

      <!-- 错误消息 -->
      <div v-if="error" class="error-message">
        {{ error.message }}
      </div>

      <!-- 成功消息 -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <!-- 重置密码表单 -->
      <form v-if="!successMessage" class="reset-password-form" @submit.prevent="handleResetPassword">
        <!-- 邮箱 -->
        <div class="form-item">
          <label for="email">邮箱</label>
          <input id="email" v-model="formData.email" type="email" placeholder="请输入注册时使用的邮箱" autocomplete="email"
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

        <!-- 新密码 -->
        <div class="form-item">
          <label for="newPassword">新密码</label>
          <input id="newPassword" v-model="formData.newPassword" type="password" placeholder="请输入新密码"
            autocomplete="new-password" @blur="validateNewPassword" />
          <span v-if="formErrors.newPassword" class="field-error">{{
            formErrors.newPassword
          }}</span>
        </div>

        <!-- 确认密码 -->
        <div class="form-item">
          <label for="confirmPassword">确认密码</label>
          <input id="confirmPassword" v-model="formData.confirmPassword" type="password" placeholder="请再次输入新密码"
            autocomplete="new-password" @blur="validateConfirmPassword" />
          <span v-if="formErrors.confirmPassword" class="field-error">{{
            formErrors.confirmPassword
          }}</span>
        </div>

        <!-- 重置密码按钮 -->
        <button type="submit" class="submit-button" :disabled="loading">
          <span v-if="loading">重置中...</span>
          <span v-else>重置密码</span>
        </button>
      </form>

      <!-- 返回登录链接 -->
      <div class="login-link">
        <button type="button" class="link-button" @click="goToLogin">
          返回登录
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.reset-password-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.reset-password-container {
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

.success-message {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0c4a6e;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  text-align: center;
}

.reset-password-form {
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
}
</style>
