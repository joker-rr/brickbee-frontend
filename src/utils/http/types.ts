/**
 * ============================================================================
 * 文件名：types.ts
 * 位置：src/utils/http/types.ts
 * 作用：定义所有 TypeScript 类型
 * 为什么需要：让代码有类型提示，防止写错
 * ============================================================================
 */

import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// ----------------------------------------------------------------------------
// 1. 后端返回的统一数据格式
// ----------------------------------------------------------------------------

/**
 * 后端 API 统一响应格式
 * 
 * 示例：
 * {
 *   code: 0,
 *   message: "操作成功",
 *   data: { id: 1, name: "张三" }
 * }
 */
export interface ApiResponse<T = any> {
  code: number;        // 业务状态码：0 表示成功，其他表示失败
  message: string;     // 提示信息，如："登录成功"、"用户名错误"
  data: T;            // 实际返回的数据，类型由泛型 T 决定
  timestamp?: number;  // 可选：时间戳
  traceId?: string;   // 可选：链路追踪 ID，用于排查问题
}


/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  code: string
  message: string
  statusCode: number
  details?: any
}

/**
 * 平台类型枚举
 */
export enum PlatformType {
  CSGOBUY = 'CSGOBUY',
  MARKET = 'MARKET',
  BUFF = 'BUFF'
}



// ----------------------------------------------------------------------------
// 2. 自定义请求配置
// ----------------------------------------------------------------------------

/**
 * 自定义的请求配置
 * 继承 Axios 的配置，添加了我们自己的配置项
 */
export interface CustomRequestConfig extends AxiosRequestConfig {
  // 是否显示 Loading 加载动画（默认 true）
  // 使用场景：有些请求不需要 Loading，比如轮询
  showLoading?: boolean;

  // 是否显示错误提示（默认 true）
  // 使用场景：有些错误需要自己处理，不需要全局提示
  showError?: boolean;

  // 是否需要 Token（默认 true）
  // 使用场景：登录接口、公开接口不需要 Token
  needToken?: boolean;

  // 是否启用重试（默认 false）
  // 使用场景：网络不稳定时，可以自动重试
  retry?: boolean;

  // 重试次数（默认 3 次）
  retryCount?: number;

  // 重试延迟时间（默认 1000ms）
  retryDelay?: number;

  // 自定义错误处理函数
  // 使用场景：某些接口需要特殊的错误处理逻辑
  customErrorHandler?: (error: any) => void;

  // 是否返回原始响应（默认 false）
  // 使用场景：需要获取响应头、状态码等信息时
  rawResponse?: boolean;
}

// ----------------------------------------------------------------------------
// 3. 请求元数据
// ----------------------------------------------------------------------------

/**
 * 请求元数据
 * 用于存储请求的额外信息
 */
export interface RequestMetadata {
  startTime: number;   // 请求开始时间，用于计算耗时
  retryCount: number;  // 当前重试次数
}

/**
 * 自定义的内部请求配置
 * 这是 Axios 内部使用的配置类型
 */
export interface CustomInternalRequestConfig extends InternalAxiosRequestConfig {
  metadata?: RequestMetadata;  // 请求元数据
  showLoading?: boolean;       // 继承自定义配置
  showError?: boolean;
  needToken?: boolean;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  customErrorHandler?: (error: any) => void;
  rawResponse?: boolean;
}

// ----------------------------------------------------------------------------
// 4. 业务状态码枚举
// ----------------------------------------------------------------------------

/**
 * 业务状态码
 * 这些是后端定义的业务状态码，不是 HTTP 状态码
 * 
 * 示例：
 * - 登录成功：code = 0
 * - 用户名错误：code = 400
 * - Token 过期：code = 10001
 */
export const BusinessCode = {
  // 成功
  SUCCESS: 0,

  // HTTP 相关（400-599）
  PARAM_ERROR: 400,           // 参数错误
  UNAUTHORIZED: 401,          // 未授权（未登录）
  FORBIDDEN: 403,             // 禁止访问（无权限）
  NOT_FOUND: 404,            // 资源不存在
  SERVER_ERROR: 500,         // 服务器内部错误
  SERVICE_UNAVAILABLE: 503,  // 服务不可用

  // 业务相关（10000+）
  NO_TOKEN: 10001,
  TOKEN_EXPIRED: 10002,       // Token 过期
  TOKEN_INVALID: 10003,       // Token 无效
  PERMISSION_DENIED: 10101,   // 权限不足
  FREQUENT_REQUESTS: 10004,   // 请求过于频繁
} as const;

// 类型定义
export type BusinessCode = typeof BusinessCode[keyof typeof BusinessCode];
// ----------------------------------------------------------------------------
// 5. HTTP 状态码枚举
// ----------------------------------------------------------------------------

/**
 * HTTP 状态码
 * 这些是标准的 HTTP 状态码
 */
export const HttpStatus = {
  OK: 200,                          // 成功
  CREATED: 201,                     // 已创建
  NO_CONTENT: 204,                  // 无内容
  BAD_REQUEST: 400,                 // 错误的请求
  UNAUTHORIZED: 401,                // 未授权
  FORBIDDEN: 403,                   // 禁止访问
  NOT_FOUND: 404,                   // 未找到
  REQUEST_TIMEOUT: 408,             // 请求超时
  TOO_MANY_REQUESTS: 429,           // 请求过多
  INTERNAL_SERVER_ERROR: 500,       // 服务器内部错误
  BAD_GATEWAY: 502,                 // 错误网关
  SERVICE_UNAVAILABLE: 503,         // 服务不可用
  GATEWAY_TIMEOUT: 504,             // 网关超时
} as const;
// 类型定义
export type HttpStatus = typeof HttpStatus[keyof typeof HttpStatus];
// ----------------------------------------------------------------------------
// 6. 自定义错误类
// ----------------------------------------------------------------------------

/**
 * 自定义的 API 错误类
 * 继承自 Error，添加了业务状态码等信息
 * 
 * 使用场景：
 * throw new ApiError('用户名不存在', 400);
 */
export class ApiError extends Error {
  public code: number;      // 错误码
  public data?: any;        // 错误相关的数据
  public traceId?: string;  // 链路追踪 ID

  constructor(message: string, code: number, data?: any, traceId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
    this.traceId = traceId;
  }
}

// ----------------------------------------------------------------------------
// 使用示例
// ----------------------------------------------------------------------------

/*
// 1. 定义 API 返回的数据类型
interface User {
  id: number;
  name: string;
  email: string;
}

// 2. 发起请求时指定类型
const getUser = async () => {
  // 返回值类型是 User
  const user = await http.get<User>('/user/info');
  logger.log(user.name); // ✅ 有类型提示
};

// 3. 自定义请求配置
const login = async () => {
  await http.post('/auth/login', data, {
    showLoading: false,  // 不显示 Loading
    needToken: false,    // 不需要 Token
  });
};

// 4. 捕获错误
try {
  await http.get('/api/data');
} catch (error) {
  if (error instanceof ApiError) {
    logger.log('错误码:', error.code);
    logger.log('错误信息:', error.message);
  }
}
*/