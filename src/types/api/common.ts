/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}
