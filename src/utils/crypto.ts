/**
 * 加密工具模块
 *
 * 使用 Web Crypto API 进行 AES-GCM 加密/解密
 * 用于本地存储 API Key 的加密保护
 */

/**
 * 将字符串转换为 ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer as ArrayBuffer
}

/**
 * 将 ArrayBuffer 转换为字符串
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * 将 Base64 字符串转换为 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * 从密钥字符串派生加密密钥
 * 使用 PBKDF2 算法增强安全性
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  // 将密码转换为密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // 使用 PBKDF2 派生 AES-GCM 密钥
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000, // 迭代次数，增加暴力破解难度
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 *
 * @param plaintext - 要加密的明文
 * @param password - 用户密钥
 * @returns 加密后的 Base64 字符串（包含 salt 和 iv）
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  // 生成随机盐值和初始化向量
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 派生加密密钥
  const key = await deriveKey(password, salt)

  // 加密数据
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    stringToArrayBuffer(plaintext)
  )

  // 组合 salt + iv + 密文
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return arrayBufferToBase64(combined.buffer)
}

/**
 * 解密数据
 *
 * @param ciphertext - 加密的 Base64 字符串
 * @param password - 用户密钥
 * @returns 解密后的明文
 * @throws 如果密钥错误或数据被篡改，将抛出错误
 */
export async function decrypt(ciphertext: string, password: string): Promise<string> {
  const combined = new Uint8Array(base64ToArrayBuffer(ciphertext))

  // 提取 salt、iv 和密文
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const encrypted = combined.slice(28)

  // 派生解密密钥
  const key = await deriveKey(password, salt)

  // 解密数据
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encrypted
  )

  return arrayBufferToString(decrypted)
}

/**
 * 验证密钥是否正确
 *
 * @param ciphertext - 加密的数据
 * @param password - 要验证的密钥
 * @returns 密钥是否正确
 */
export async function verifyPassword(ciphertext: string, password: string): Promise<boolean> {
  try {
    await decrypt(ciphertext, password)
    return true
  } catch {
    return false
  }
}

/**
 * 生成密钥强度评估
 *
 * @param password - 密钥
 * @returns 强度等级 (weak | medium | strong)
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 6) return 'weak'

  let score = 0

  // 长度得分
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // 包含数字
  if (/\d/.test(password)) score++

  // 包含小写字母
  if (/[a-z]/.test(password)) score++

  // 包含大写字母
  if (/[A-Z]/.test(password)) score++

  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}
