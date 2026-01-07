/*
 * @Author: joker.rrr 
 * @Date: 2025-12-25 09:31:10
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-28 17:39:30
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\modules\platform\execution\executionSession.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * ============================================================================
 * 文件名：executionSession.ts
 * 位置：src/api/modules/platform/execution/executionSession.ts
 * 作用：执行会话 API（创建 / 刷新 / 销毁 / 状态查询）
 * ============================================================================
 */

import { request } from '@/api/client'
import type {
  CreateExecutionSessionRequest,
  CreateExecutionSessionResponse,
  RefreshExecutionSessionResponse,
  ExecutionSessionStatusResponse
} from './types'
import { API_PREFIX, EXECUTION_SESSION_ROUTES } from '../../../common'

/**
 * 执行会话 API
 *
 * 说明：
 * - execution_token 通过 Header 传递（X-Execution-Token）
 * - 不依赖登录态 Token
 */
export const executionSessionApi = {

  /**
   * 创建执行会话
   *
   * @param data - 创建执行会话参数
   */
  // api/executionSession.ts
  create: (data: CreateExecutionSessionRequest, encryptedKey: string) =>
    request.post<CreateExecutionSessionResponse>(
      `${API_PREFIX.EXECUTION_SESSIONS}${EXECUTION_SESSION_ROUTES.CREATE}`,
      data,
      {
        needToken: true,
        showLoading: true,
        headers: {
          'X-Encrypted-Key': encryptedKey,
        }
      }
    ),

  /**
   * 刷新执行会话
   *
   * @param executionToken - 当前执行 Token
   */
  refresh: (executionToken: string) =>
    request.post<RefreshExecutionSessionResponse>(
      `${API_PREFIX.EXECUTION_SESSIONS}${EXECUTION_SESSION_ROUTES.REFRESH}`,
      {},
      {
        headers: {
          'X-Execution-Token': executionToken
        },
        needToken: true,
        showLoading: false
      }
    ),

  /**
   * 销毁执行会话
   *
   * @param executionToken - 执行 Token
   */
  destroy: (executionToken: string) =>
    request.delete<{ success: boolean }>(
      `${API_PREFIX.EXECUTION_SESSIONS}${EXECUTION_SESSION_ROUTES.DESTROY}`,
      {
        headers: {
          'X-Execution-Token': executionToken
        },
        needToken: true,
        showLoading: false
      }
    ),

  /**
   * 获取执行会话状态
   *
   * @param executionToken - 执行 Token
   */
  getStatus: (executionToken: string) =>
    request.get<ExecutionSessionStatusResponse>(
      `${API_PREFIX.EXECUTION_SESSIONS}${EXECUTION_SESSION_ROUTES.STATUS}`,
      {
        headers: {
          'X-Execution-Token': executionToken
        },
        needToken: false,
        showLoading: false
      }
    )
}
