import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { useRouter } from 'vue-router'
import { toast } from '@/utils/toast'

import type {
  LoginParams,
  RegisterParams,
  ChangePasswordParams,
  ResetPasswordParams,
  SendRegisterCodeParams,
  SendResetPasswordCodeParams,
} from '@/api';


/**
 * 认证 Composable
 */
export function useAuth() {
  const userStore = useUserStore()
  const router = useRouter()

  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 是否已登录
   */
  const isLoggedIn = computed(() => userStore.isLoggedIn)

  /**
   * 当前用户
   */
  const currentUser = computed(() => userStore.userInfo)

  /**
   * 登录
   */
  const login = async (params: LoginParams) => {
    loading.value = true
    error.value = null

    try {
      await userStore.login(params)
      toast.success('登录成功！')
      // 登录成功后跳转到首页
      router.push('/')
    } catch (err) {
      error.value = err as Error
      toast.error(`登录失败：${(err as Error).message}`)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  const logout = async () => {
    loading.value = true
    error.value = null

    try {
      await userStore.logout()
      toast.success('登出成功！')
      // 登出后跳转到登录页
      router.push('/login')
    } catch (err) {
      error.value = err as Error
      toast.error(`登出失败：${(err as Error).message}`)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 注册
   */
  const register = async (params: RegisterParams) => {
    loading.value = true
    error.value = null

    try {
      await userStore.register(params)
      toast.success('注册成功！即将跳转到登录页...')
      // 注册成功后跳转到登录页
      router.push('/login')
    } catch (err) {
      error.value = err as Error
      toast.error(`注册失败：${(err as Error).message}`)
      throw err
    } finally {
      loading.value = false
    }
  }





  /**
   * 发送注册验证码
   *
   * @param params - 邮箱地址
   *
   * 使用示例：
   * const userStore = useUserStore();
   * await userStore.sendRegisterCode({ email: 'user@example.com' });
   */
  const sendRegisterCode = async (params: SendRegisterCodeParams) => {
    loading.value = true
    error.value = null
    try {
      await userStore.sendRegisterCode(params);
      toast.success('验证码已发送至您的邮箱！')
    } catch (err) {
      error.value = err as Error
      toast.error(`发送验证码失败：${(err as Error).message}`)
      throw err;
    } finally {
      loading.value = false
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
    loading.value = true
    error.value = null
    try {
      await userStore.sendResetPasswordCode(params);
      toast.success('验证码已发送至您的邮箱！')
    } catch (err) {
      error.value = err as Error
      toast.error(`发送验证码失败：${(err as Error).message}`)
      throw err;
    } finally {
      loading.value = false
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
    loading.value = true
    error.value = null
    try {
      await userStore.resetPassword(params);
      toast.success('密码重置成功！即将跳转到登录页...')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err) {
      error.value = err as Error
      toast.error(`密码重置失败：${(err as Error).message}`)
      throw err;
    } finally {
      loading.value = false
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
    loading.value = true
    error.value = null
    try {
      await userStore.changePassword(params);
      toast.success('密码修改成功！')
    } catch (err) {
      error.value = err as Error
      toast.error(`密码修改失败：${(err as Error).message}`)
      throw err;
    } finally {
      loading.value = false
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
    loading.value = true
    error.value = null
    try {
      // 调用接口获取用户信息
      const user = await userStore.fetchUserInfo();
      return user
    } catch (err) {
      error.value = err as Error
      toast.error(`获取用户信息失败：${(err as Error).message}`)
      throw err;
    } finally {
      loading.value = false
    }
  };






  return {
    loading,
    error,
    isLoggedIn,
    currentUser,

    // Actions
    login,
    logout,
    register,
    sendRegisterCode,
    sendResetPasswordCode,
    resetPassword,
    changePassword,
    fetchUserInfo,
  }
}
