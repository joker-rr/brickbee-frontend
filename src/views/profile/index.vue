<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables'
import { BaseCard, BaseButton, BaseInput, BaseModal } from '@/components/base'
import { validatePassword, validateConfirmPassword } from '@/utils/validation'
import type { ChangePasswordParams } from '@/api'
import { logger } from '../../utils/logger'
// --------------------------------------------------------------------------
// 1. Composables
// --------------------------------------------------------------------------

const { currentUser, changePassword, fetchUserInfo, loading } = useAuth()

// --------------------------------------------------------------------------
// 2. 状态
// --------------------------------------------------------------------------

// 修改密码模态框
const showPasswordModal = ref(false)
const passwordForm = ref<ChangePasswordParams>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref('')

// --------------------------------------------------------------------------
// 3. 生命周期
// --------------------------------------------------------------------------

onMounted(async () => {
  // 如果用户信息不存在，尝试获取
  if (!currentUser.value) {
    try {
      await fetchUserInfo()
    } catch (err) {
      logger.error('获取用户信息失败:', err)
    }
  }
})

// --------------------------------------------------------------------------
// 4. 方法
// --------------------------------------------------------------------------

/**
 * 打开修改密码模态框
 */
const openPasswordModal = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordError.value = ''
  showPasswordModal.value = true
}

/**
 * 验证密码表单
 */
const validatePasswordForm = (): boolean => {
  passwordError.value = ''

  // 验证当前密码
  if (!passwordForm.value.oldPassword) {
    passwordError.value = '请输入当前密码'
    return false
  }

  // 验证确认密码
  const confirmPasswordValidation = validateConfirmPassword(
    passwordForm.value.newPassword,
    passwordForm.value.confirmPassword
  )
  if (!confirmPasswordValidation.valid) {
    passwordError.value = confirmPasswordValidation.message
    return false
  }


  // 验证新密码
  const newPasswordValidation = validatePassword(passwordForm.value.newPassword)
  if (!newPasswordValidation.valid) {
    passwordError.value = newPasswordValidation.message
    return false
  }

  // 验证新密码不能与当前密码相同
  if (passwordForm.value.newPassword === passwordForm.value.oldPassword) {
    passwordError.value = '新密码不能与当前密码相同'
    return false
  }



  return true
}

/**
 * 提交修改密码
 */
const handleChangePassword = async () => {
  if (!validatePasswordForm()) {
    return
  }

  try {
    await changePassword(passwordForm.value)
    showPasswordModal.value = false
  } catch (err: any) {
    passwordError.value = err.message || '密码修改失败'
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">
      <h1 class="page-title">个人中心</h1>

      <!-- 加载状态 -->
      <div v-if="loading && !currentUser" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 用户信息 -->
      <template v-else-if="currentUser">
        <!-- 基本信息卡片 -->
        <BaseCard class="info-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>

          <div class="user-profile">
            <div class="profile-avatar">
              {{ currentUser.nickname?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <div class="profile-info">
              <div class="info-row">
                <span class="info-label">用户名</span>
                <span class="info-value">{{ currentUser.nickname }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">邮箱</span>
                <span class="info-value">{{ currentUser.email }}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- 账户安全卡片 -->
        <BaseCard class="security-card">
          <template #header>
            <div class="card-header">
              <span>账户安全</span>
            </div>
          </template>

          <div class="security-section">
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">登录密码</div>
                <div class="security-desc">定期修改密码可以提高账户安全性</div>
              </div>
              <BaseButton type="primary" size="medium" @click="openPasswordModal">
                修改密码
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </template>

      <!-- 错误状态 -->
      <div v-else class="error-state">
        <p>无法加载用户信息</p>
        <BaseButton type="primary" @click="fetchUserInfo">重试</BaseButton>
      </div>
    </div>

    <!-- 修改密码模态框 -->
    <BaseModal v-model="showPasswordModal" title="修改密码" :confirm-loading="loading" @confirm="handleChangePassword"
      @cancel="showPasswordModal = false">
      <div class="password-form">
        <div class="form-item">
          <label class="form-label">当前密码</label>
          <BaseInput v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password
            :error="passwordError && !passwordForm.oldPassword ? '请输入当前密码' : ''" />
        </div>

        <div class="form-item">
          <label class="form-label">新密码</label>
          <BaseInput v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少 6 位）" show-password
            :error="passwordError && !passwordForm.newPassword ? '请输入新密码' : ''" />
        </div>

        <div class="form-item">
          <label class="form-label">确认新密码</label>
          <BaseInput v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password
            :error="passwordError && !passwordForm.confirmPassword ? '请确认新密码' : ''" />
        </div>

        <!-- 错误提示 -->
        <div v-if="passwordError" class="form-error">
          {{ passwordError }}
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: calc(100vh - 64px);
  background: #f5f5f5;
  padding: 40px 20px;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 32px;
  text-align: center;
}

// --------------------------------------------------------------------------
// 加载和错误状态
// --------------------------------------------------------------------------

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;

  .loading-spinner {
    width: 48px;
    height: 48px;
    margin: 0 auto 20px;
    border: 4px solid #f0f0f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    font-size: 16px;
    margin-bottom: 20px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// --------------------------------------------------------------------------
// 卡片
// --------------------------------------------------------------------------

.info-card,
.security-card {
  margin-bottom: 24px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

// --------------------------------------------------------------------------
// 用户资料
// --------------------------------------------------------------------------

.user-profile {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .info-label {
    font-weight: 600;
    color: #666;
    font-size: 14px;
  }

  .info-value {
    color: #333;
    font-size: 15px;
  }
}

// --------------------------------------------------------------------------
// 账户安全
// --------------------------------------------------------------------------

.security-section {
  padding: 12px 0;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;

  .security-info {
    flex: 1;

    .security-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }

    .security-desc {
      font-size: 14px;
      color: #666;
    }
  }
}

// --------------------------------------------------------------------------
// 修改密码表单
// --------------------------------------------------------------------------

.password-form {
  padding: 8px 0;
}

.form-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-error {
  margin-top: 16px;
  padding: 12px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #f5222d;
  font-size: 14px;
}

// --------------------------------------------------------------------------
// 响应式
// --------------------------------------------------------------------------

@media (max-width: 768px) {
  .profile-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .user-profile {
    flex-direction: column;
    text-align: center;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
    font-size: 40px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    button {
      width: 100%;
    }
  }
}
</style>
