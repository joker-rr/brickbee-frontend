# Market 自动化脚本系统 - 详细架构设计文档

> **版本**: 1.0.0  
> **更新日期**: 2024-12-25  
> **作者**: AI Architecture Assistant  
> **状态**: Draft

---

## 目录

1. [架构概述](#一架构概述)
2. [系统架构图](#二系统架构图)
3. [Token 体系设计](#三token-体系设计)
4. [执行会话机制](#四执行会话机制)
5. [API Key 存储方案](#五api-key-存储方案)
6. [API 代理设计](#六api-代理设计)
7. [时序图](#七时序图)
8. [接口定义](#八接口定义)
9. [数据结构定义](#九数据结构定义)
10. [安全设计](#十安全设计)
11. [容错与高可用](#十一容错与高可用)
12. [与现有模块集成](#十二与现有模块集成)
13. [未来演进路径](#十三未来演进路径)
14. [部署建议](#十四部署建议)
15. [附录](#十五附录)

---

## 一、架构概述

### 1.1 项目背景

Market 自动化脚本系统是 CS 饰品交易管理平台的核心模块，用于实现与第三方 Market 平台的自动化交互。由于 Market 平台存在 CORS 限制，且 API Key 具有高敏感性（仅显示一次），系统需要在保证安全性的前提下，支持高频（≈300ms 间隔）、24小时持续运行的脚本执行。

### 1.2 核心约束

| 约束项 | 描述 | 影响 |
|--------|------|------|
| CORS 限制 | Market 平台不允许跨域请求 | 必须通过服务器代理 |
| API Key 敏感性 | 仅显示一次，跨设备获取成本极高 | 需要安全存储方案 |
| 高频执行 | ≈300ms 间隔调用 | 需要高性能代理 |
| 持续运行 | 24小时不间断 | Token 自动刷新机制 |
| 多设备支持 | 用户可能在多设备使用 | 云端存储选项 |

### 1.3 设计目标

1. **安全性**：API Key 永不明文传输，多层加密保护
2. **可用性**：支持24小时持续运行，自动处理 Token 刷新
3. **灵活性**：支持本地模式和云端模式，满足不同用户需求
4. **可扩展性**：架构支持未来扩展到其他平台（CSGOBUY、BUFF）
5. **可观测性**：完善的日志和监控，便于问题排查

### 1.4 核心概念关系图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            概念关系图                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   用户身份认证                    执行权限认证                API Key 管理   │
│   ┌──────────┐                  ┌──────────────┐           ┌──────────────┐│
│   │  access  │──────创建────────►│  execution   │───映射───►│   API Key    ││
│   │  token   │                  │    token     │           │   (内存)     ││
│   └────┬─────┘                  └──────┬───────┘           └──────────────┘│
│        │                               │                                    │
│        │刷新                           │刷新                                │
│        ▼                               ▼                                    │
│   ┌──────────┐                  ┌──────────────┐                           │
│   │ refresh  │                  │   Session    │                           │
│   │  token   │                  │   Manager    │                           │
│   └──────────┘                  └──────────────┘                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、系统架构图

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    客户端层                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                           Web 前端 (Vue 3 + TypeScript)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │  认证模块   │  │ 脚本编辑器  │  │ 执行控制台  │  │   Key 管理面板      │   │  │
│  │  │ AuthModule  │  │ScriptEditor │  │ExecConsole  │  │  KeyManagement      │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │  │
│  │         │                │                │                    │              │  │
│  │  ┌──────┴────────────────┴────────────────┴────────────────────┴──────────┐   │  │
│  │  │                        Composables 层                                   │   │  │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │  │
│  │  │  │ useAuth    │  │useExecution│  │useApiKey   │  │useScript   │        │   │  │
│  │  │  │            │  │Session     │  │Manager     │  │Runner      │        │   │  │
│  │  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                      │                                         │  │
│  │  ┌───────────────────────────────────┴───────────────────────────────────┐    │  │
│  │  │                        安全层 (Security Layer)                         │    │  │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐    │    │  │
│  │  │  │ TokenManager    │  │ CryptoService   │  │ LocalKeyVault       │    │    │  │
│  │  │  │ (内存存储)      │  │ (AES加密)       │  │ (localStorage加密)  │    │    │  │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘    │    │  │
│  │  └───────────────────────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTPS (TLS 1.3)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    服务端层                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                           API Gateway (Nginx/Kong)                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐    │  │
│  │  │ Rate Limiter    │  │ Request Router  │  │ SSL Termination             │    │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                          │
│  ┌───────────────────────────────────────┴───────────────────────────────────────┐  │
│  │                           应用服务 (Node.js / NestJS)                          │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                          认证服务 (AuthService)                          │  │  │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐    │  │  │
│  │  │  │ JWT Manager   │  │ Session Store │  │ Refresh Token Handler     │    │  │  │
│  │  │  └───────────────┘  └───────────────┘  └───────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                     执行会话服务 (ExecutionSessionService)               │  │  │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐    │  │  │
│  │  │  │ Session Mgr   │  │ Token Factory │  │ TTL Manager               │    │  │  │
│  │  │  │ (内存映射)    │  │               │  │ (过期管理)                │    │  │  │
│  │  │  └───────────────┘  └───────────────┘  └───────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                       API 代理服务 (ProxyService)                        │  │  │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐    │  │  │
│  │  │  │ Whitelist Mgr │  │ Request Trans │  │ Response Sanitizer        │    │  │  │
│  │  │  │ (白名单校验)  │  │ (请求转换)    │  │ (响应脱敏)                │    │  │  │
│  │  │  └───────────────┘  └───────────────┘  └───────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    API Key 管理服务 (KeyVaultService)                    │  │  │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐    │  │  │
│  │  │  │ Key Encryptor │  │ Key Storage   │  │ Key Decryptor (内存)      │    │  │  │
│  │  │  │ (AES-256-GCM) │  │ (数据库加密)  │  │ (运行时解密)              │    │  │  │
│  │  │  └───────────────┘  └───────────────┘  └───────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                          │
│  ┌───────────────────────────────────────┴───────────────────────────────────────┐  │
│  │                               数据存储层                                       │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────────┐  │  │
│  │  │ PostgreSQL    │  │ Redis         │  │ In-Memory Store                   │  │  │
│  │  │ - 用户数据    │  │ - 会话缓存    │  │ - execution_token → API Key 映射  │  │  │
│  │  │ - 加密的Key   │  │ - 限流计数    │  │ - 热数据缓存                      │  │  │
│  │  │ - 脚本配置    │  │ - Token黑名单 │  │                                   │  │  │
│  │  └───────────────┘  └───────────────┘  └───────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTPS (代理请求)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 第三方平台层                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                           │
│  │ Market API    │  │ CSGOBUY API   │  │ BUFF API      │                           │
│  │ (主要)        │  │ (未来)        │  │ (未来)        │                           │
│  └───────────────┘  └───────────────┘  └───────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              数据流向图                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  【本地模式数据流】                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  用户输入 ──► 前端AES加密 ──► localStorage存储                                │  │
│  │  API Key      (用户密码派生)    密文                                          │  │
│  │                                                                              │  │
│  │  用户解锁 ──► AES解密 ──► 临时传输加密 ──► 创建会话 ──► execution_token      │  │
│  │  输入密码     明文Key      上传服务端        服务端内存   前端持有             │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  【云端模式数据流】                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  用户输入 ──► 前端临时加密 ──► HTTPS传输 ──► 服务端重加密 ──► PostgreSQL     │  │
│  │  API Key      传输密钥        密文传输      主密钥加密       存储密文         │  │
│  │                                                                              │  │
│  │  用户登录 ──► 验证身份 ──► 服务端解密 ──► 创建会话 ──► execution_token       │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  【API 调用数据流】                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  前端请求 ──► 携带execution_token ──► ProxyService ──► 注入API Key ──► Market │  │
│  │  (不含Key)                            验证+白名单      服务端内存             │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、Token 体系设计

### 3.1 三层 Token 架构

| Token 类型 | 用途 | 生命周期 | 存储位置 | 刷新机制 |
|-----------|------|---------|---------|---------|
| **access_token** | 用户身份认证 | 15-30分钟 | 前端内存 | refresh_token 自动刷新 |
| **refresh_token** | 刷新 access_token | 7-30天 | HttpOnly Cookie | 重新登录 |
| **execution_token** | 执行权限凭证 | 1小时 | 前端内存 + 服务端内存 | 主动刷新（窗口10分钟） |

### 3.2 Token 结构定义

```typescript
// access_token (JWT Payload)
interface AccessTokenPayload {
  sub: string           // 用户ID
  iat: number           // 签发时间
  exp: number           // 过期时间
  type: 'access'        // Token 类型
  deviceId: string      // 设备ID
  roles: string[]       // 用户角色
  version: number       // Token 版本（用于强制失效）
}

// refresh_token (存储在 Redis)
interface RefreshTokenRecord {
  id: string            // Token ID
  userId: string        // 用户ID
  deviceId: string      // 设备ID
  expiresAt: Date       // 过期时间
  createdAt: Date       // 创建时间
  lastUsedAt: Date      // 最后使用时间
  revoked: boolean      // 是否被撤销
  ipAddress: string     // IP 地址
  userAgent: string     // User Agent
}

// execution_token (能力令牌)
interface ExecutionToken {
  id: string            // Token ID (UUID)
  userId: string        // 用户ID
  deviceId: string      // 设备ID
  platform: string      // 平台类型: 'MARKET' | 'CSGOBUY' | 'BUFF'
  expiresAt: Date       // 过期时间
  signature: string     // HMAC 签名
}

// 服务端执行会话 (内存存储)
interface ExecutionSession {
  tokenId: string               // execution_token ID
  userId: string                // 用户ID
  deviceId: string              // 设备ID
  platform: string              // 平台类型
  apiKey: string                // API Key (明文，仅在内存中)
  storageMode: 'local' | 'cloud'  // 存储模式
  createdAt: Date               // 创建时间
  expiresAt: Date               // 过期时间
  lastActivityAt: Date          // 最后活跃时间
  requestCount: number          // 请求计数
  status: 'created' | 'active' | 'expired' | 'error'
}
```

### 3.3 Token 刷新时间线

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Token 刷新时间线                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  access_token (30分钟)                                                              │
│  ├───────────────────────────────────────────────────────────────────────────────┤ │
│  │  0         5         10        20        25        30 (分钟)                   │ │
│  │  │─────────│─────────│─────────│─────────│─────────│                          │ │
│  │  │ 活跃期                              │ 刷新窗口  │ 过期                       │ │
│  │  │                                     │ (自动刷新)│                           │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  execution_token (1小时)                                                            │
│  ├───────────────────────────────────────────────────────────────────────────────┤ │
│  │  0         10        30        50        60 (分钟)                             │ │
│  │  │─────────│─────────│─────────│─────────│                                    │ │
│  │  │ 活跃期                    │ 刷新窗口  │ 过期                                 │ │
│  │  │                           │ (10分钟)  │                                     │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  24小时运行示意：                                                                    │
│  - access_token 刷新次数: ~48 次                                                    │
│  - execution_token 刷新次数: 24 次                                                  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 四、执行会话机制

### 4.1 执行会话状态机

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          执行会话状态机                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                    ┌──────────────────────────────────────────┐                    │
│                    │                                          │                    │
│                    ▼                                          │                    │
│  ┌─────────┐    创建    ┌─────────┐    激活    ┌─────────┐   │                    │
│  │  INIT   │──────────►│ CREATED │──────────►│ ACTIVE  │───┤ 刷新               │
│  │ (初始)  │           │ (已创建) │           │ (活跃)  │   │                    │
│  └─────────┘           └────┬────┘           └────┬────┘   │                    │
│                             │                     │         │                    │
│                             │ 超时/失败           │ 过期    │                    │
│                             ▼                     ▼         │                    │
│                        ┌─────────┐           ┌─────────┐   │                    │
│                        │  ERROR  │           │ EXPIRED │───┘                    │
│                        │ (错误)  │           │ (过期)  │                        │
│                        └────┬────┘           └────┬────┘                        │
│                             │                     │                              │
│                             └─────────┬───────────┘                              │
│                                       ▼                                          │
│                                  ┌─────────┐                                     │
│                                  │DESTROYED│                                     │
│                                  │ (销毁)  │                                     │
│                                  └─────────┘                                     │
│                                                                                  │
│  状态转换：                                                                       │
│  - INIT → CREATED    : 调用 /session/create                                      │
│  - CREATED → ACTIVE  : 首次 API 调用成功                                         │
│  - ACTIVE → ACTIVE   : 刷新窗口内调用 /session/refresh                           │
│  - ACTIVE → EXPIRED  : TTL 到期且未刷新                                          │
│  - * → DESTROYED     : 用户主动销毁 / 强制登出                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 会话管理配置

```typescript
const SessionConfig = {
  sessionTTL: 60 * 60 * 1000,        // 1小时
  refreshWindow: 10 * 60 * 1000,      // 刷新窗口 10分钟
  maxSessionsPerUser: 3,              // 每用户最多3个并发会话
  cleanupInterval: 60 * 1000          // 清理间隔 1分钟
}
```

---

## 五、API Key 存储方案

### 5.1 双模式对比

| 特性 | 本地模式 | 云端模式 |
|------|---------|---------|
| **适用场景** | 高级用户/不信任云端 | 普通用户/跨设备使用 |
| **存储位置** | localStorage (浏览器) | PostgreSQL (服务器) |
| **加密方式** | 用户密码派生 AES-256-GCM | 服务端主密钥 AES-256-GCM |
| **跨设备** | ❌ 需要重新导入 | ✅ 自动同步 |
| **安全性** | 密钥永不离开设备 | 需要信任服务器 |
| **恢复难度** | 需要用户密码 | 账号登录即可 |

### 5.2 加密方案详解

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              加密方案详解                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  【前端加密 - 本地模式】                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  算法: AES-256-GCM                                                            │  │
│  │  密钥派生: PBKDF2 (SHA-256, 100,000 迭代)                                     │  │
│  │  Salt: 随机 16 字节                                                           │  │
│  │  IV: 随机 12 字节                                                             │  │
│  │  认证标签: 16 字节                                                            │  │
│  │                                                                              │  │
│  │  存储格式: Base64(salt[16] + iv[12] + ciphertext + tag[16])                   │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  【服务端加密 - 云端模式】                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  算法: AES-256-GCM                                                            │  │
│  │  主密钥: 环境变量 API_KEY_ENCRYPTION_SECRET                                    │  │
│  │  密钥派生: scrypt (N=2^14, r=8, p=1)                                          │  │
│  │  IV: 随机 16 字节                                                             │  │
│  │  认证标签: 16 字节                                                            │  │
│  │                                                                              │  │
│  │  数据库存储: encrypted_key, iv, auth_tag 分列存储                             │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  【传输加密】                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  HTTPS: TLS 1.3                                                               │  │
│  │  临时传输密钥: 每次上传生成新的 AES-256 密钥                                   │  │
│  │  密钥交换: 随请求一起发送 (HTTPS 保护)                                        │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 六、API 代理设计

### 6.1 代理处理流程

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              API 代理处理流程                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  前端请求                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  POST /api/proxy/market                                                       │  │
│  │  Headers:                                                                     │  │
│  │    Authorization: Bearer {access_token}                                       │  │
│  │    X-Execution-Token: {execution_token}                                       │  │
│  │  Body: { action: "getInventory", params: {...} }                              │  │
│  │                                                                               │  │
│  │  ⚠️ 请求中不包含 API Key                                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                          │
│                                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  处理步骤：                                                                    │  │
│  │  Step 1: AuthGuard - 验证 access_token (JWT)                                  │  │
│  │  Step 2: ExecutionGuard - 验证 execution_token，获取会话                      │  │
│  │  Step 3: WhitelistGuard - 检查 action 是否在白名单                            │  │
│  │  Step 4: RateLimiter - 检查用户/全局限流                                       │  │
│  │  Step 5: RequestTransformer - 注入 API Key，构造 Market 请求                  │  │
│  │  Step 6: HttpClient - 发送请求到 Market (带重试)                              │  │
│  │  Step 7: ResponseSanitizer - 脱敏响应，记录日志                               │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 白名单配置

```typescript
// 允许的 Market API 动作
const MARKET_WHITELIST = [
  // 库存相关
  { action: 'getInventory', method: 'GET', path: '/api/v2/inventory', 
    rateLimit: { max: 30, window: 60 } },
  { action: 'getItemInfo', method: 'GET', path: '/api/v2/get-item-info', 
    rateLimit: { max: 60, window: 60 } },
  
  // 在售相关
  { action: 'getSelling', method: 'GET', path: '/api/v2/items', 
    rateLimit: { max: 30, window: 60 } },
  { action: 'setPrice', method: 'POST', path: '/api/v2/set-price', 
    rateLimit: { max: 60, window: 60 } },
  { action: 'removeItem', method: 'POST', path: '/api/v2/remove-from-sale', 
    rateLimit: { max: 30, window: 60 } },
  
  // 价格相关
  { action: 'getPrices', method: 'GET', path: '/api/v2/prices/class_instance', 
    rateLimit: { max: 60, window: 60 } },
  { action: 'getMinPrices', method: 'GET', path: '/api/v2/search-item-by-hash-name', 
    rateLimit: { max: 120, window: 60 } },
  
  // 交易相关
  { action: 'getOrders', method: 'GET', path: '/api/v2/orders', 
    rateLimit: { max: 30, window: 60 } },
  { action: 'buyItem', method: 'POST', path: '/api/v2/buy', 
    rateLimit: { max: 10, window: 60 } },
  
  // 账户相关（只读）
  { action: 'getBalance', method: 'GET', path: '/api/v2/get-money', 
    rateLimit: { max: 30, window: 60 } },
]

// 危险操作黑名单（明确禁止）
const BLACKLIST_ACTIONS = [
  'changeApiKey', 
  'deleteAccount', 
  'withdrawMoney', 
  'changeTradeUrl'
]
```

---

## 七、时序图

### 7.1 本地模式完整流程

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant FE as 前端
    participant LKV as LocalKeyVault
    participant TM as TokenManager
    participant BE as 后端服务
    participant ESS as ExecutionSession
    participant PS as ProxyService
    participant MKT as Market API

    rect rgb(240, 248, 255)
        Note over U, LKV: 阶段1: API Key 导入 (首次)
        U->>FE: 输入 API Key + 密码
        FE->>FE: PBKDF2 派生密钥
        FE->>FE: AES-256-GCM 加密
        FE->>LKV: 存储加密后的 Key
        LKV-->>FE: 存储成功
        FE-->>U: 显示导入成功
    end

    rect rgb(255, 248, 240)
        Note over U, TM: 阶段2: 解锁 API Key
        U->>FE: 输入密码解锁
        FE->>LKV: 请求解密
        LKV->>LKV: AES 解密
        LKV-->>FE: 返回明文 API Key
        FE->>TM: 临时存储明文 Key (内存)
    end

    rect rgb(240, 255, 240)
        Note over FE, ESS: 阶段3: 创建执行会话
        FE->>FE: 生成临时传输密钥
        FE->>FE: 用传输密钥加密 API Key
        FE->>BE: POST /session/create
        BE->>BE: 解密传输层
        BE->>ESS: 创建会话 (API Key存内存)
        ESS->>ESS: 生成 execution_token
        ESS-->>BE: 返回 token
        BE-->>FE: {executionToken, expiresAt}
        FE->>TM: 存储 execution_token
        FE->>TM: 清除明文 API Key
    end

    rect rgb(248, 240, 255)
        Note over FE, MKT: 阶段4: 脚本执行 (循环)
        loop 每 300ms
            FE->>BE: POST /proxy/market + execution_token
            BE->>ESS: 验证 token
            ESS-->>BE: 返回会话 (含 API Key)
            BE->>PS: 执行代理请求
            PS->>PS: 白名单校验 + 限流
            PS->>MKT: 请求 (注入 API Key)
            MKT-->>PS: 返回数据
            PS-->>BE: 脱敏响应
            BE-->>FE: 返回结果
        end
    end

    rect rgb(255, 255, 240)
        Note over FE, ESS: 阶段5: Token 刷新 (每50分钟)
        FE->>FE: 检测 token 即将过期
        FE->>BE: POST /session/refresh
        BE->>ESS: 刷新会话
        ESS->>ESS: 生成新 token
        ESS-->>BE: 新 execution_token
        BE-->>FE: {newToken, expiresAt}
        FE->>TM: 更新 token
    end
```

### 7.2 云端模式流程

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant FE as 前端
    participant BE as 后端服务
    participant KVS as KeyVaultService
    participant DB as PostgreSQL
    participant ESS as ExecutionSession
    participant PS as ProxyService
    participant MKT as Market API

    rect rgb(240, 248, 255)
        Note over U, DB: 阶段1: API Key 存储 (首次)
        U->>FE: 输入 API Key
        FE->>FE: 生成临时传输密钥
        FE->>FE: 加密 API Key
        FE->>BE: POST /keys/store
        BE->>KVS: 存储请求
        KVS->>KVS: 解密传输层
        KVS->>KVS: 主密钥重加密
        KVS->>DB: 存储加密 Key
        DB-->>KVS: 成功
        KVS-->>BE: 成功
        BE-->>FE: 存储成功
    end

    rect rgb(240, 255, 240)
        Note over FE, ESS: 阶段2: 登录后创建会话
        U->>FE: 登录
        FE->>BE: POST /auth/login
        BE-->>FE: {accessToken, refreshToken}
        FE->>BE: POST /session/create (云端模式)
        BE->>KVS: 获取解密 Key
        KVS->>DB: 读取加密 Key
        DB-->>KVS: 返回密文
        KVS->>KVS: 主密钥解密
        KVS-->>BE: 返回明文 Key
        BE->>ESS: 创建会话
        ESS-->>BE: execution_token
        BE-->>FE: {executionToken, expiresAt}
    end

    rect rgb(248, 240, 255)
        Note over FE, MKT: 阶段3: 脚本执行
        loop 每 300ms
            FE->>BE: POST /proxy/market
            BE->>ESS: 验证 + 获取会话
            BE->>PS: 代理请求
            PS->>MKT: 请求 (注入 Key)
            MKT-->>PS: 返回数据
            PS-->>FE: 返回结果
        end
    end
```

---

## 八、接口定义

### 8.1 认证相关

```yaml
# POST /api/auth/login - 用户登录
Request:
  body:
    email: string
    password: string
    deviceId: string
Response:
  200: { accessToken: string, expiresIn: number }
  401: { error: "INVALID_CREDENTIALS" }

# POST /api/auth/refresh - 刷新 Token
Request:
  cookies: { refresh_token: string }
Response:
  200: { accessToken: string, expiresIn: number }
  401: { error: "REFRESH_TOKEN_EXPIRED" }

# POST /api/auth/logout - 登出
Request:
  headers: { Authorization: "Bearer {access_token}" }
Response:
  200: { success: true }
```

### 8.2 执行会话相关

```yaml
# POST /api/session/create - 创建执行会话
Request:
  headers: { Authorization: "Bearer {access_token}" }
  body:
    platform: "MARKET" | "CSGOBUY" | "BUFF"
    storageMode: "local" | "cloud"
    encryptedKey?: string     # 本地模式需要
    transportKey?: string     # 本地模式需要
Response:
  200: { executionToken: string, expiresAt: string, sessionId: string }
  400: { error: "INVALID_KEY_FORMAT" }
  401: { error: "KEY_DECRYPTION_FAILED" }

# POST /api/session/refresh - 刷新执行会话
Request:
  headers:
    Authorization: "Bearer {access_token}"
    X-Execution-Token: string
Response:
  200: { executionToken: string, expiresAt: string }
  401: { error: "SESSION_EXPIRED" }

# DELETE /api/session - 销毁执行会话
Request:
  headers:
    Authorization: "Bearer {access_token}"
    X-Execution-Token: string
Response:
  200: { success: true }

# GET /api/session/status - 获取会话状态
Request:
  headers:
    Authorization: "Bearer {access_token}"
    X-Execution-Token: string
Response:
  200:
    status: "active" | "expired" | "error"
    expiresAt: string
    requestCount: number
    lastActivityAt: string
```

### 8.3 API 代理相关

```yaml
# POST /api/proxy/market - Market API 代理
Request:
  headers:
    Authorization: "Bearer {access_token}"
    X-Execution-Token: string
    X-Request-Id?: string
  body:
    action: string            # 白名单中的动作
    params?: object           # 动作参数
Response:
  200: { success: true, data: any, requestId: string }
  400: { error: "INVALID_ACTION", allowedActions: string[] }
  429: { error: "RATE_LIMIT_EXCEEDED", retryAfter: number }
  502: { error: "MARKET_API_ERROR", message: string }
```

### 8.4 Key 管理相关

```yaml
# POST /api/keys/store - 存储 API Key (云端模式)
Request:
  headers: { Authorization: "Bearer {access_token}" }
  body:
    platform: "MARKET" | "CSGOBUY" | "BUFF"
    encryptedKey: string
    transportKey: string
Response:
  200: { success: true, storedAt: string }
  400: { error: "KEY_ALREADY_EXISTS" }

# DELETE /api/keys/{platform} - 删除 API Key
Request:
  headers: { Authorization: "Bearer {access_token}" }
Response:
  200: { success: true }

# GET /api/keys/status - 获取 Key 存储状态
Request:
  headers: { Authorization: "Bearer {access_token}" }
Response:
  200:
    platforms:
      - { platform: "MARKET", stored: true, storedAt: string }
      - { platform: "CSGOBUY", stored: false }
```

---

## 九、数据结构定义

### 9.1 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Key 存储表 (云端模式)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    encrypted_key TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- 刷新令牌表
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT
);

-- 执行日志表 (审计)
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    request_id VARCHAR(64),
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 9.2 Redis 数据结构

```typescript
// 刷新令牌缓存
// Key: refresh_token:{tokenId}
// TTL: 与 refresh_token 过期时间一致
interface RefreshTokenCache {
  userId: string
  deviceId: string
  expiresAt: number
  version: number
}

// 限流计数器
// Key: rate_limit:{userId}:{action}
// Type: Counter
// TTL: 窗口大小 (秒)

// Token 黑名单
// Key: token_blacklist:{tokenId}
// Value: "1"
// TTL: 与原 token 剩余有效期一致

// 用户会话索引
// Key: user_sessions:{userId}
// Type: SET
// Members: sessionId1, sessionId2, ...
```

---

## 十、安全设计

### 10.1 Token 安全措施

| 措施 | access_token | refresh_token | execution_token |
|------|-------------|---------------|-----------------|
| 签名算法 | RS256 / ES256 | N/A (不透明) | HMAC-SHA256 |
| 存储方式 | 内存 | HttpOnly Cookie | 内存 |
| 传输保护 | Authorization Header | Cookie (Secure) | X-Execution-Token |
| 绑定验证 | userId + deviceId | userId + deviceId | userId + deviceId + tokenId |
| 撤销机制 | 版本号检查 | 黑名单 | 会话销毁 |

### 10.2 日志脱敏规则

```typescript
const sanitizers = {
  // API Key 脱敏
  apiKey: (value: string) => value ? value.slice(0, 4) + '****' + value.slice(-4) : value,
  
  // URL 参数脱敏
  url: (url: string) => url.replace(/key=[^&\s]+/gi, 'key=***'),
  
  // 请求体脱敏
  body: (body: any) => {
    const sensitiveFields = ['key', 'apiKey', 'password', 'token']
    const sanitized = { ...body }
    sensitiveFields.forEach(field => {
      if (field in sanitized) sanitized[field] = '***'
    })
    return sanitized
  }
}
```

### 10.3 限流策略

```typescript
const RateLimitConfig = {
  // 用户级别
  user: {
    global: { max: 100, window: 60 },     // 100 req/min
    perAction: {
      getMinPrices: { max: 120, window: 60 },
      setPrice: { max: 60, window: 60 },
      buyItem: { max: 10, window: 60 },
    }
  },
  
  // 全局级别
  global: {
    total: { max: 10000, window: 60 },    // 10K req/min
  },
  
  // IP 级别 (防滥用)
  ip: {
    unauthenticated: { max: 10, window: 60 },
    authenticated: { max: 200, window: 60 }
  }
}
```

---

## 十一、容错与高可用

### 11.1 服务器重启恢复策略

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              服务器重启恢复策略                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  问题：服务器重启后，内存中的 execution_token → API Key 映射丢失                    │
│                                                                                     │
│  【云端模式恢复】                                                                    │
│  1. 前端检测到 execution_token 失效 (502/401)                                       │
│  2. 前端自动调用 POST /session/create (云端模式)                                    │
│  3. 服务端从 PostgreSQL 读取加密 Key，解密后重建会话                                │
│  4. 返回新的 execution_token                                                       │
│  5. 前端无感知继续执行                                                              │
│                                                                                     │
│  【本地模式恢复】                                                                    │
│  1. 前端检测到 execution_token 失效                                                 │
│  2. 提示用户重新输入解锁密码                                                        │
│  3. 解密本地存储的 Key                                                              │
│  4. 调用 POST /session/create 重建会话                                              │
│  5. 继续执行                                                                        │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 网络异常重试策略

```typescript
const RetryConfig = {
  backoff: {
    initial: 1000,        // 初始延迟 1s
    multiplier: 2,        // 倍数
    maxDelay: 30000,      // 最大延迟 30s
    jitter: 0.1           // 抖动 10%
  },
  
  retryOn: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 502, 503, 504],
  noRetryOn: [400, 401, 403, 429],
  maxRetries: 3
}
```

---

## 十二、与现有模块集成

### 12.1 复用平台适配器

```typescript
// 扩展现有适配器接口
interface IPlatformAutomationAdapter extends IPlatformInventoryAdapter {
  /** 获取最低价格 (高频调用) */
  getMinPrice(hashName: string, signal?: AbortSignal): Promise<MinPriceResult>
  
  /** 批量设置价格 */
  batchSetPrice(items: Array<{ itemId: string; price: number }>): Promise<BatchResult>
  
  /** 自动改价逻辑 */
  autoAdjustPrice(item: SellingItem, strategy: PriceStrategy): Promise<AdjustResult>
}
```

### 12.2 复用缓存策略

```typescript
import { HybridCache } from '@/utils/cache/hybrid-cache'

// 价格缓存 (短 TTL)
export const priceCache = new HybridCache<MinPriceResult>({
  name: 'market-prices',
  runtimeTTL: 10 * 1000,        // 10秒
  storageTTL: 30 * 1000,        // 30秒
  maxSize: 1000
})

// 物品信息缓存 (长 TTL)
export const itemInfoCache = new HybridCache<ItemDetail>({
  name: 'market-items',
  runtimeTTL: 5 * 60 * 1000,    // 5分钟
  storageTTL: 30 * 60 * 1000,   // 30分钟
  maxSize: 500
})
```

### 12.3 数据流集成

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              数据流集成架构                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  共享数据层                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐         │
│  │ inventoryStore  │  │  sellingStore   │  │     automationStore        │         │
│  │ (库存数据)      │  │  (在售数据)     │  │     (脚本执行状态)         │         │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘         │
│           │                    │                          │                         │
│           └────────────────────┼──────────────────────────┘                         │
│                                │                                                    │
│                                ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                      platformStore (统一入口)                                │   │
│  │  - currentPlatform: 'MARKET'                                                │   │
│  │  - executionSession: ExecutionSession                                       │   │
│  │  - connectionStatus: 'connected' | 'disconnected'                           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Composables 层                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐         │
│  │  useInventory   │  │   useSelling    │  │     useAutomation          │         │
│  │  (复用)         │  │   (复用)        │  │     (新增)                 │         │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘         │
│           │                    │                          │                         │
│           └────────────────────┼──────────────────────────┘                         │
│                                │                                                    │
│                                ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                  usePlatformAdapter (复用 + 扩展)                            │   │
│  │  - getInventory()      // 现有                                              │   │
│  │  - getSelling()        // 现有                                              │   │
│  │  - getMinPrice()       // 新增                                              │   │
│  │  - autoAdjustPrice()   // 新增                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 十三、未来演进路径

### 13.1 Electron/Tauri 客户端

```
优势：
- 无 CORS 限制，可直连 Market API
- API Key 完全本地化，无需服务器中转
- 更低延迟，更高性能

架构变化：
┌─────────────┐      ┌─────────────┐      ┌─────────────────────────────┐
│  Renderer   │      │    Main     │      │      Market API             │
│  (Vue App)  │◄────►│  (Node.js)  │◄────►│      (直连)                 │
│             │ IPC  │ + API Key   │HTTPS │                             │
└─────────────┘      └─────────────┘      └─────────────────────────────┘

API Key 存储在 Main 进程，Renderer 无法直接访问
```

### 13.2 云托管独占 Worker

```
场景：用户希望脚本 24/7 运行，无需保持浏览器开启

架构：
┌─────────────┐      ┌─────────────────┐      ┌───────────────────────┐
│   Web UI    │      │  Worker Manager │      │   Isolated Worker     │
│  (配置脚本) │─────►│  (调度服务)     │─────►│   (独立进程/容器)     │
│             │      │                 │      │   - 运行用户脚本      │
│             │◄─────│                 │◄─────│   - 持有 API Key      │
└─────────────┘ 日志 └─────────────────┘ 状态 └───────────────────────┘

安全考虑：
- 每个用户独立 Worker 进程/容器
- API Key 仅在 Worker 内存中
- 资源隔离 (CPU, 内存, 网络)
```

### 13.3 多平台扩展

```typescript
const PLATFORMS = [
  {
    id: 'MARKET',
    name: 'Market.CSGO',
    baseUrl: 'https://market.csgo.com',
    authType: 'apiKey',
    features: { inventory: true, selling: true, automation: true, trading: true },
  },
  {
    id: 'CSGOBUY',
    name: 'CSGOBUY',
    baseUrl: 'https://csgobuy.com',
    authType: 'apiKey',
    features: { inventory: true, selling: true, automation: false, trading: true },
  },
  {
    id: 'BUFF',
    name: 'BUFF163',
    baseUrl: 'https://buff.163.com',
    authType: 'cookie',
    features: { inventory: true, selling: true, automation: false, trading: false },
  }
]
```

---

## 十四、部署建议

### 14.1 Docker Compose 配置

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://...
      - REDIS_URL=redis://...
      - API_KEY_ENCRYPTION_SECRET=${API_KEY_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=brickbee
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### 14.2 环境变量

```bash
# 数据库
DATABASE_URL=postgres://user:password@host:5432/brickbee

# Redis
REDIS_URL=redis://host:6379

# 加密密钥 (必须保密！)
API_KEY_ENCRYPTION_SECRET=<32+ 字符随机字符串>
JWT_SECRET=<32+ 字符随机字符串>
SESSION_SIGNING_SECRET=<32+ 字符随机字符串>

# JWT 配置
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# 执行会话配置
SESSION_TTL_SECONDS=3600
SESSION_REFRESH_WINDOW_SECONDS=600
MAX_SESSIONS_PER_USER=3
```

---

## 十五、附录

### 15.1 术语表

| 术语 | 说明 |
|------|------|
| **access_token** | 用户身份认证令牌，JWT 格式，短期有效 |
| **refresh_token** | 用于刷新 access_token 的长期令牌 |
| **execution_token** | 执行权限凭证，用于代理 API 调用 |
| **ExecutionSession** | 服务端执行会话，包含 API Key 映射 |
| **LocalKeyVault** | 前端本地加密存储 |
| **ServerKeyVault** | 服务端加密存储 |
| **ProxyService** | API 代理服务 |
| **白名单** | 允许代理的 Market API 动作列表 |

### 15.2 错误码定义

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| `INVALID_CREDENTIALS` | 401 | 用户名或密码错误 |
| `ACCESS_TOKEN_EXPIRED` | 401 | access_token 已过期 |
| `REFRESH_TOKEN_EXPIRED` | 401 | refresh_token 已过期 |
| `EXECUTION_TOKEN_EXPIRED` | 401 | execution_token 已过期 |
| `SESSION_NOT_FOUND` | 401 | 执行会话不存在 |
| `INVALID_ACTION` | 400 | 请求的动作不在白名单 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超出请求频率限制 |
| `KEY_DECRYPTION_FAILED` | 401 | API Key 解密失败 |
| `MARKET_API_ERROR` | 502 | Market API 返回错误 |
| `MARKET_API_TIMEOUT` | 504 | Market API 请求超时 |

### 15.3 参考资料

1. [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
2. [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
3. [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
4. [NestJS Security](https://docs.nestjs.com/security/authentication)

### 15.4 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0.0 | 2024-12-25 | 初始版本 |

---

## 附录 A: 关键代码示例

### A.1 前端加密服务

```typescript
// src/services/crypto.service.ts
export class CryptoService {
  private readonly ALGORITHM = 'AES-GCM'
  private readonly KEY_LENGTH = 256
  private readonly PBKDF2_ITERATIONS = 100000

  async encrypt(plaintext: string, password: string): Promise<string> {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const baseKey = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: this.PBKDF2_ITERATIONS, hash: 'SHA-256' },
      baseKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false, ['encrypt']
    )
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv }, key, encoder.encode(plaintext)
    )
    
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
    combined.set(salt, 0)
    combined.set(iv, 16)
    combined.set(new Uint8Array(ciphertext), 28)
    
    return btoa(String.fromCharCode(...combined))
  }

  async decrypt(encryptedData: string, password: string): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const ciphertext = combined.slice(28)
    
    const encoder = new TextEncoder()
    const baseKey = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: this.PBKDF2_ITERATIONS, hash: 'SHA-256' },
      baseKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false, ['decrypt']
    )
    
    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv }, key, ciphertext
    )
    
    return new TextDecoder().decode(decrypted)
  }
}

export const cryptoService = new CryptoService()
```

### A.2 执行会话 Composable

```typescript
// src/composables/business/useExecutionSession.ts
import { ref, computed, onBeforeUnmount } from 'vue'
import { localKeyVault } from '@/services/local-key-vault'
import { sessionApi } from '@/api/modules/session'

export function useExecutionSession() {
  const executionToken = ref<string | null>(null)
  const expiresAt = ref<Date | null>(null)
  const status = ref<'idle' | 'active' | 'expired' | 'error'>('idle')
  const refreshTimer = ref<number | null>(null)

  const isActive = computed(() => status.value === 'active')
  const timeToExpiry = computed(() => 
    expiresAt.value ? expiresAt.value.getTime() - Date.now() : 0
  )

  async function createSession(params: {
    platform: string
    storageMode: 'local' | 'cloud'
    password?: string
  }) {
    // ... 创建会话逻辑
  }

  async function refreshSession() {
    // ... 刷新会话逻辑
  }

  async function destroySession() {
    // ... 销毁会话逻辑
  }

  onBeforeUnmount(() => {
    if (refreshTimer.value) clearTimeout(refreshTimer.value)
  })

  return {
    executionToken, expiresAt, status, isActive, timeToExpiry,
    createSession, refreshSession, destroySession
  }
}
```

---

*文档结束*
