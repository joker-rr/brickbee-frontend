# Market 自动化脚本系统 - 实现文档

## 概述

本文档描述了 Market 自动化脚本系统的完整实现，该系统支持安全的 API Key 管理、执行会话控制和高频脚本执行。

## 已实现功能

### 1. API Key 安全管理

#### 1.1 本地加密存储
- **AES-256-GCM 加密**: 使用 Web Crypto API 实现业界标准加密
- **PBKDF2 密钥派生**: 100,000 次迭代，从用户密码安全派生加密密钥
- **随机盐值和 IV**: 每次加密使用随机生成的 16 字节盐值和 12 字节初始化向量
- **本地存储**: 加密后的 Key 存储在 localStorage，永不明文存储

#### 1.2 云端存储（预留）
- 接口已定义，功能待后端实现

### 2. 执行会话管理

#### 2.1 会话生命周期
- **会话创建**: 解锁 API Key 后自动创建执行会话
- **1 小时 TTL**: 会话有效期为 1 小时
- **自动刷新**: 剩余时间不足 10 分钟时自动刷新会话
- **会话销毁**: 支持手动关闭会话

#### 2.2 Token 架构
- **execution_token**: 会话专用令牌，用于所有后续请求
- **API Key 单次传输**: 仅在创建会话时传输一次，之后使用 token

### 3. 脚本执行引擎

#### 3.1 执行控制
- **启动**: 开始执行自动化脚本
- **暂停**: 临时暂停执行，保留状态
- **恢复**: 从暂停状态继续执行
- **停止**: 完全停止执行

#### 3.2 执行配置
- **执行间隔**: 可配置，最小 300ms
- **实时日志**: 记录所有执行过程

### 4. Market API 代理

#### 4.1 支持的接口
- `getInventory`: 获取库存列表
- `getSelling`: 获取在售商品
- `getItemDetail`: 获取商品详情
- `updatePrice`: 更新商品价格
- `listItem`: 上架商品
- `delistItem`: 下架商品

#### 4.2 代理特性
- 所有请求通过后端代理，绕过 CORS 限制
- 自动携带 execution_token
- 请求统计和错误追踪

### 5. 状态监控

#### 5.1 会话状态
- 活跃/过期/错误状态显示
- 剩余时间倒计时
- 请求计数

#### 5.2 请求统计
- 总请求数
- 成功/失败数
- 成功率百分比
- 平均响应时间

#### 5.3 运行日志
- 实时日志显示
- 日志级别（info/warn/error/debug）
- 毫秒级时间戳
- 日志清除功能

---

## 文件结构

```
src/
├── types/
│   ├── auth.d.ts                 # 认证类型定义
│   ├── execution.d.ts            # 执行会话类型定义
│   └── market-automation.d.ts    # 自动化脚本类型定义
│
├── services/
│   └── crypto.service.ts         # AES-256-GCM 加密服务
│
├── api/
│   └── modules/
│       └── execution-session.ts  # 执行会话 API
│
├── composables/
│   └── business/
│       ├── useApiKeyStorage.ts   # API Key 本地加密存储
│       ├── useExecutionSession.ts # 执行会话管理
│       ├── useMarketProxy.ts     # Market API 代理请求
│       └── useScriptRunner.ts    # 脚本执行器
│
├── stores/
│   └── modules/
│       └── execution.ts          # 执行状态 Store
│
├── components/
│   └── market-automation/
│       ├── index.ts              # 组件导出
│       ├── ApiKeySetup.vue       # API Key 设置组件
│       ├── LocalKeyUnlock.vue    # 本地 Key 解锁组件
│       ├── ExecutionStatus.vue   # 执行状态显示组件
│       ├── ScriptControls.vue    # 脚本控制组件
│       └── RequestStats.vue      # 请求统计组件
│
└── views/
    └── platform-center/
        ├── index.vue             # 平台中心主页（已集成）
        └── components/
            ├── PlatformTabs.vue  # 平台 Tab（已添加自动化）
            └── AutomationTab.vue # 自动化 Tab 主组件
```

---

## 核心组件说明

### 1. CryptoService (`crypto.service.ts`)

```typescript
// 加密 API Key
const result = await cryptoService.encrypt(apiKey, password)
// 返回: { ciphertext, salt, iv }

// 解密 API Key
const apiKey = await cryptoService.decrypt(encryptedData, password)
```

**加密参数:**
- 算法: AES-256-GCM
- 密钥长度: 256 位
- PBKDF2 迭代: 100,000 次
- 盐值长度: 16 字节
- IV 长度: 12 字节
- 认证标签: 128 位

### 2. useApiKeyStorage

```typescript
const apiKeyStorage = useApiKeyStorage()

// 保存加密的 Key
await apiKeyStorage.saveLocal(platform, apiKey, password)

// 检查是否有本地 Key
const hasKey = apiKeyStorage.hasLocalKey(platform)

// 解密 Key
const apiKey = await apiKeyStorage.decryptLocal(platform, password)

// 删除本地 Key
apiKeyStorage.removeLocal(platform)
```

### 3. useExecutionSession

```typescript
const session = useExecutionSession()

// 创建会话
await session.createSession({
  platform: PlatformType.MARKET,
  storageMode: 'local',
  password: 'user-password'
})

// 刷新会话
await session.refreshSession()

// 销毁会话
await session.destroySession()
```

### 4. useScriptRunner

```typescript
const runner = useScriptRunner({
  config: { interval: 1000 },
  platform: PlatformType.MARKET,
  onTick: async () => {
    // 执行逻辑
    await marketProxy.getInventory()
  },
  onError: (error) => console.error(error),
  onStatusChange: (status) => { /* 状态变化 */ },
  onLog: (log) => { /* 日志记录 */ }
})

runner.start()   // 启动
runner.pause()   // 暂停
runner.resume()  // 恢复
runner.stop()    // 停止
```

### 5. useMarketProxy

```typescript
const proxy = useMarketProxy()

// 获取库存
const inventory = await proxy.getInventory({ page: 1, limit: 100 })

// 更新价格
await proxy.updatePrice(itemId, newPrice)

// 上架商品
await proxy.listItem(itemId, price)
```

---

## UI 组件

### ApiKeySetup.vue
API Key 设置表单，支持:
- 存储模式选择（本地/云端）
- API Key 输入
- 加密密码设置（本地模式）
- 密码确认验证

### LocalKeyUnlock.vue
本地 Key 解锁界面:
- 显示 Key 创建时间
- 密码输入
- 解锁/删除 Key 操作

### ExecutionStatus.vue
执行会话状态面板:
- 状态指示器（活跃/过期/错误）
- 平台信息
- 剩余时间倒计时
- 请求计数
- 详细统计（可选）
- 刷新/关闭会话按钮

### ScriptControls.vue
脚本控制面板:
- 状态显示（运行中/已暂停/已停止）
- 配置面板（执行间隔）
- 控制按钮（启动/暂停/恢复/停止）

### RequestStats.vue
请求统计面板:
- 总请求数
- 成功/失败数
- 成功率
- 平均响应时间

---

## 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ApiKeySetup│  │LocalKeyUnlock│ │ScriptControls│ │ExecutionStatus│ │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘        │
└────────┼─────────────┼─────────────┼─────────────┼──────────────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Composables 层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │useApiKeyStorage│ │useExecutionSession│ │useScriptRunner│      │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘          │
│          │                 │                 │                   │
│          ▼                 ▼                 ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │CryptoService │  │ExecutionAPI  │  │useMarketProxy│           │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        存储层                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ localStorage │  │   后端 API   │  │ExecutionStore│           │
│  │ (加密数据)    │  │              │  │  (Pinia)     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 安全特性

### 1. API Key 保护
- ✅ 使用 AES-256-GCM 加密存储
- ✅ PBKDF2 密钥派生（100,000 次迭代）
- ✅ 随机盐值和 IV
- ✅ API Key 仅在创建会话时传输一次
- ✅ 后续请求使用 execution_token

### 2. 会话安全
- ✅ 1 小时会话过期
- ✅ 自动刷新机制
- ✅ 会话隔离（每个平台独立）

### 3. 传输安全
- ✅ 所有请求通过后端代理
- ✅ 支持传输加密（可选）

---

## 使用指南

### 首次使用

1. 进入「平台中心」页面
2. 选择 Market 平台
3. 点击「自动化」Tab
4. 点击「设置 API Key」
5. 输入 API Key 和加密密码
6. 保存后输入密码解锁
7. 解锁成功后即可使用脚本功能

### 日常使用

1. 进入自动化 Tab
2. 点击「解锁 API Key」
3. 输入密码解锁
4. 点击「启动脚本」开始执行
5. 可随时暂停/停止脚本
6. 查看统计和日志监控执行状态

### 会话管理

- 会话有效期 1 小时
- 剩余不足 10 分钟时自动刷新
- 可手动点击「刷新会话」
- 可点击「关闭会话」结束会话

---

## 后续开发建议

### 待实现功能

1. **云端存储模式**: 需后端实现加密存储 API
2. **自定义脚本**: 支持用户编写自定义执行逻辑
3. **定时任务**: 支持定时启动/停止脚本
4. **多平台并行**: 同时运行多个平台的脚本
5. **执行历史**: 记录历史执行结果
6. **告警通知**: 错误时发送通知

### API 端点需求

后端需要实现以下 API：

```
POST /api/execution/session          # 创建执行会话
POST /api/execution/session/refresh  # 刷新会话
DELETE /api/execution/session        # 销毁会话
GET /api/execution/session/status    # 获取会话状态
POST /api/market/proxy               # Market API 代理
```

---

## 版本信息

- **实现日期**: 2024-12
- **技术栈**: Vue 3 + TypeScript + Pinia + Vite
- **加密标准**: AES-256-GCM + PBKDF2
