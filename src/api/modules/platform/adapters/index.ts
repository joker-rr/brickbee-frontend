/*
 * @Author: joker.rrr 
 * @Date: 2025-12-24 17:44:33
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-31 16:57:28
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\api\modules\platform\adapters\index.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 平台适配器统一导出
 */

import { PlatformType } from '@/config/platform.config'
import type { IPlatformAdapter } from './base.adapter'
import { BasePlatformAdapter } from './base.adapter'
import { csgobuyAdapter } from './csgobuy.adapter'
import { marketAdapter } from './market.adapter'
import { buffAdapter } from './buff.adapter'

// 导出基类和类型
export * from './base.adapter'

// 导出适配器类型
export * from './types'

// 导出各平台适配器
export { csgobuyAdapter } from './csgobuy.adapter'
export { marketAdapter } from './market.adapter'
export { buffAdapter } from './buff.adapter'

// 导出类型
export type { BasePlatformAdapter }

/**
 * 平台适配器映射
 */
const adapterMap: Record<PlatformType, IPlatformAdapter> = {
  [PlatformType.CSGOBUY]: csgobuyAdapter,
  [PlatformType.MARKET]: marketAdapter,
  [PlatformType.BUFF]: buffAdapter
}

/**
 * 获取平台适配器
 * @param platform 平台类型
 * @returns 对应的平台适配器
 */
export function getPlatformAdapter(platform: PlatformType): IPlatformAdapter {
  const adapter = adapterMap[platform]

  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  return adapter
}


/**
 * 获取所有平台适配器
 */
export function getAllAdapters(): IPlatformAdapter[] {
  return Object.values(adapterMap)
}

/**
 * 检查所有平台连接状态
 */
export async function checkAllConnections(): Promise<
  Record<PlatformType, { connected: boolean; message?: string }>
> {
  const results: Record<PlatformType, { connected: boolean; message?: string }> = {} as Record<
    PlatformType,
    { connected: boolean; message?: string }
  >

  await Promise.all(
    Object.entries(adapterMap).map(async ([platform, adapter]) => {
      results[platform as PlatformType] = await adapter.checkConnection()
    })
  )

  return results
}


export * from './adapter'