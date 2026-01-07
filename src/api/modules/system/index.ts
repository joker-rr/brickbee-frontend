/*
 * @Author: joker.rrr
 * @Date: 2025-12-02 22:00:25
 * @LastEditors: joker.rrr
 * @LastEditTime: 2025-12-09
 * @FilePath: \brickbee-frontend-ts\src\api\modules\system\index.ts
 * @Description: 系统相关 API
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { request } from '@/api/client'
import type { SystemConfig, DictItem } from './types'

/**
 * 系统相关 API
 */
export const systemApi = {
  /**
   * 健康检查
   */
  healthCheck: () =>
    request.get('/health', {
      needToken: false,
      showLoading: false,
      rawResponse: true
    }),

  /**
   * 获取系统配置
   */
  getConfig: () =>
    request.get<SystemConfig>('/system/config', {
      needToken: false
    }),

  /**
   * 获取字典数据
   */
  getDictionary: (type: string) =>
    request.get<DictItem[]>(`/system/dict/${type}`, {
      needToken: false
    }),

  /**
   * 上传文件
   */
  uploadFile: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    return request.post<{ url: string }>('/system/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      }
    })
  },

  /**
   * 下载文件
   */
  downloadFile: async (fileId: string, filename: string) => {
    const response = await request.get(`/system/download/${fileId}`, {
      responseType: 'blob'
    })

    // 创建下载链接
    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(link.href)
  }
}
