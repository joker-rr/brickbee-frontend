/**
 * ============================================================================
 * 文件名：validation.ts
 * 位置：src/utils/validation.ts
 * 作用：通用的验证函数（纯函数）
 * 为什么需要：
 *   1. 复用验证逻辑
 *   2. 统一验证规则
 *   3. 易于测试
 * ============================================================================
 */

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean
  message: string
}

// --------------------------------------------------------------------------
// 1. 邮箱验证
// --------------------------------------------------------------------------

/**
 * 验证邮箱格式
 *
 * @param email - 邮箱地址
 * @returns 验证结果
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, message: '请输入邮箱' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: '请输入有效的邮箱地址' }
  }

  return { valid: true, message: '' }
}

// --------------------------------------------------------------------------
// 2. 密码验证
// --------------------------------------------------------------------------

/**
 * 验证密码强度
 *
 * @param password - 密码
 * @param options - 验证选项
 * @returns 验证结果
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number
    maxLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumber?: boolean
    requireSpecialChar?: boolean
  } = {}
): ValidationResult {
  const {
    minLength = 6,
    maxLength = 30,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    // requireSpecialChar = true,
  } = options
  if (!password) {
    return { valid: false, message: '请输入密码' }
  }

  if (password.length < minLength) {
    return { valid: false, message: `密码至少 ${minLength} 个字符` }
  }

  if (password.length > maxLength) {
    return { valid: false, message: `密码最多 ${maxLength} 个字符` }
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' }
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' }
  }

  if (requireNumber && !/\d/.test(password)) {
    return { valid: false, message: '密码必须包含数字' }
  }

  // if (requireSpecialChar && !/[!@#$%^&*(),.-?+":{}|<>]/.test(password)) {
  //   return { valid: false, message: '密码必须包含特殊字符' }
  // }

  return { valid: true, message: '' }
}

/**
 * 验证确认密码
 *
 * @param password - 原密码
 * @param confirmPassword - 确认密码
 * @returns 验证结果
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, message: '请再次输入密码' }
  }

  if (confirmPassword !== password) {
    return { valid: false, message: '两次输入的密码不一致' }
  }

  return { valid: true, message: '' }
}

// --------------------------------------------------------------------------
// 3. 用户名验证
// --------------------------------------------------------------------------

/**
 * 验证用户名
 *
 * @param username - 用户名
 * @param options - 验证选项
 * @returns 验证结果
 */
export function validateUsername(
  username: string,
  options: {
    minLength?: number
    maxLength?: number
    allowSpecialChars?: boolean
  } = {}
): ValidationResult {
  const {
    minLength = 3,
    maxLength = 20,
    allowSpecialChars = false,
  } = options

  if (!username) {
    return { valid: false, message: '请输入用户名' }
  }

  if (username.length < minLength) {
    return { valid: false, message: `用户名至少 ${minLength} 个字符` }
  }

  if (username.length > maxLength) {
    return { valid: false, message: `用户名最多 ${maxLength} 个字符` }
  }

  const regex = allowSpecialChars ? /^[a-zA-Z0-9_-]+$/ : /^[a-zA-Z0-9_]+$/
  if (!regex.test(username)) {
    const allowedChars = allowSpecialChars ? '字母、数字、下划线和连字符' : '字母、数字和下划线'
    return { valid: false, message: `用户名只能包含${allowedChars}` }
  }

  return { valid: true, message: '' }
}

// --------------------------------------------------------------------------
// 4. 验证码验证
// --------------------------------------------------------------------------

/**
 * 验证验证码
 *
 * @param code - 验证码
 * @param length - 验证码长度（默认 6 位）
 * @returns 验证结果
 */
export function validateVerificationCode(
  code: string,
  length: number = 6
): ValidationResult {
  if (!code) {
    return { valid: false, message: '请输入验证码' }
  }

  const regex = new RegExp(`^\\d{${length}}$`)
  if (!regex.test(code)) {
    return { valid: false, message: `验证码为 ${length} 位数字` }
  }

  return { valid: true, message: '' }
}

// --------------------------------------------------------------------------
// 5. 手机号验证
// --------------------------------------------------------------------------

/**
 * 验证手机号（中国大陆）
 *
 * @param phone - 手机号
 * @returns 验证结果
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: false, message: '请输入手机号' }
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '请输入有效的手机号' }
  }

  return { valid: true, message: '' }
}

// --------------------------------------------------------------------------
// 6. 通用验证
// --------------------------------------------------------------------------

/**
 * 验证必填项
 *
 * @param value - 值
 * @param fieldName - 字段名称
 * @returns 验证结果
 */
export function validateRequired(value: any, fieldName: string = '该字段'): ValidationResult {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: `${fieldName}不能为空` }
  }

  return { valid: true, message: '' }
}

/**
 * 验证长度范围
 *
 * @param value - 值
 * @param minLength - 最小长度
 * @param maxLength - 最大长度
 * @param fieldName - 字段名称
 * @returns 验证结果
 */
export function validateLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = '该字段'
): ValidationResult {
  if (value.length < minLength) {
    return { valid: false, message: `${fieldName}至少 ${minLength} 个字符` }
  }

  if (value.length > maxLength) {
    return { valid: false, message: `${fieldName}最多 ${maxLength} 个字符` }
  }

  return { valid: true, message: '' }
}
