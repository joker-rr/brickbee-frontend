/**
 * ============================================================================
 * 文件名：securityKey.ts
 * 位置：src/api/modules/platform/execution/securityKey.ts
 * 作用：执行会话安全密钥相关 API（公钥 / challengeId）
 * ============================================================================
 */

import { request } from '@/api/client'
import type {
    GetSecurityKey,
    SecurityKeyChallengeId,
    GetChallengeId
} from './types'
import { API_PREFIX, GET_SECURITY_KEYS_ROUTES } from '../../../common'

/**
 * 执行会话安全 Key API
 */
export const securityKeyApi = {

    /**
     * 获取服务器公钥
     *
     * 用于加密 API Key / challenge 数据
     */
    getPublicKey: () =>
        request.get<GetSecurityKey>(`${API_PREFIX.SECURITYKEY}${GET_SECURITY_KEYS_ROUTES.PUBLICKEY}`, {
            needToken: true,
            showLoading: false
        }),

    /**
     * 获取 challengeId
     *
     * @param data - 客户端生成的 challenge 信息
     */
    getChallengeId: (data: SecurityKeyChallengeId) =>
        request.post<GetChallengeId>(`${API_PREFIX.SECURITYKEY}${GET_SECURITY_KEYS_ROUTES.CHALLENGEDID}`, data, {
            needToken: true,
            showLoading: true
        })
}
