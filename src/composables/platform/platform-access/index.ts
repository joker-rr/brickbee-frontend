/**
 * 平台访问层统一导出
 *
 * 这是所有业务模块访问第三方 Market API 的唯一入口
 *
 * 使用指南：
 * 1. 获取 API Key 来源: platformKeyManager.getKeySource(platform)
 * 2. 解锁本地 Key: platformKeyManager.unlockLocalKey(platform, password)
 * 3. 创建会话: executionSessionManager.createSession(platform, apiKey)
 * 4. 获取有效 Token: executionSessionManager.getValidToken(platform)
 *
 * 调用路径示例：
 * - 库存模块: InventoryTab → useInventory → Adapter → executionSessionManager.getValidToken()
 * - 在售模块: SellingTab → useSelling → Adapter → executionSessionManager.getValidToken()
 * - 自动化模块: ScriptControls → taskRunner → executionSessionManager.getValidToken()
 */

export { platformKeyManager } from './platformKeyManager'
export { executionSessionManager } from './executionSessionManager'

export type { ApiKeySource, PlatformKeyManager, LocalEncryptedKey } from './platformKeyManager'

export type {
  ExecutionSession,
  ExecutionSessionManager,
  SessionStatus,
  SessionStats,
  SessionChangeCallback
} from './executionSessionManager'