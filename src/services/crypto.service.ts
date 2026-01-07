/**
 * 加密服务
 *
 * 使用 Web Crypto API 实现 AES-256-GCM 加密
 * 用于本地模式下 API Key 的加密存储
 */

/**
 * 加密配置
 */
const CRYPTO_CONFIG = {
  ALGORITHM: 'AES-GCM' as const,
  KEY_LENGTH: 256,
  PBKDF2_ITERATIONS: 100000,
  SALT_LENGTH: 16,
  IV_LENGTH: 12,
  TAG_LENGTH: 128
}

/**
 * 加密结果
 */
export interface EncryptionResult {
  /** 加密后的数据 (Base64) */
  ciphertext: string
  /** 盐值 (Base64) */
  salt: string
  /** 初始化向量 (Base64) */
  iv: string
}

/**
 * 加密服务类
 */
export class CryptoService {
  /**
   * 加密数据
   * @param plaintext 明文
   * @param password 密码
   * @returns 加密结果
   */
  async encrypt(plaintext: string, password: string): Promise<EncryptionResult> {
    const encoder = new TextEncoder()

    // 生成随机盐值和 IV
    const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH))

    // 从密码派生密钥
    const key = await this.deriveKey(password, salt)

    // 加密数据
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv,
        tagLength: CRYPTO_CONFIG.TAG_LENGTH
      },
      key,
      encoder.encode(plaintext)
    )

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      salt: this.arrayBufferToBase64(salt),
      iv: this.arrayBufferToBase64(iv)
    }
  }

  /**
   * 解密数据
   * @param encryptedData 加密结果
   * @param password 密码
   * @returns 明文
   */
  async decrypt(encryptedData: EncryptionResult, password: string): Promise<string> {
    const salt = this.base64ToArrayBuffer(encryptedData.salt)
    const iv = this.base64ToArrayBuffer(encryptedData.iv)
    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext)

    // 从密码派生密钥
    const key = await this.deriveKey(password, new Uint8Array(salt))

    // 解密数据
    const decrypted = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv: new Uint8Array(iv),
        tagLength: CRYPTO_CONFIG.TAG_LENGTH
      },
      key,
      ciphertext
    )

    return new TextDecoder().decode(decrypted)
  }

  /**
   * 使用 PBKDF2 从密码派生密钥
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()

    // 导入密码作为基础密钥
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    // 派生 AES 密钥
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        length: CRYPTO_CONFIG.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * 生成传输密钥（用于临时加密传输）
   */
  async generateTransportKey(): Promise<{ key: CryptoKey; exportedKey: string }> {
    const key = await crypto.subtle.generateKey(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        length: CRYPTO_CONFIG.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    )

    const exportedKey = await crypto.subtle.exportKey('raw', key)

    return {
      key,
      exportedKey: this.arrayBufferToBase64(exportedKey)
    }
  }

  /**
   * 使用传输密钥加密
   */
  async encryptWithTransportKey(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH))

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv,
        tagLength: CRYPTO_CONFIG.TAG_LENGTH
      },
      key,
      encoder.encode(plaintext)
    )

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv)
    }
  }


/**
 * 使用 RSA 公钥加密（RSA-OAEP + SHA-256）
 * @param plaintext 明文（API Key）
 * @param publicKeyPem 后端下发的 PEM 公钥
 * @returns Base64 密文
 */
 async rsaEncrypt(
  plaintext: string,
  publicKeyPem: string
): Promise<string> {
  // 1️⃣ PEM → ArrayBuffer
  const pemHeader = '-----BEGIN PUBLIC KEY-----'
  const pemFooter = '-----END PUBLIC KEY-----'
  const pemBody = publicKeyPem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  // 2️⃣ 导入 RSA 公钥
  const publicKey = await crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['encrypt']
  )

  // 3️⃣ 加密
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    encoded
  )

  // 4️⃣ 转 Base64
  return this.arrayBufferToBase64(encrypted)
}


  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }



}

// 导出单例
export const cryptoService = new CryptoService()
