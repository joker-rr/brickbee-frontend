/*
 * @Author: joker.rrr 
 * @Date: 2025-12-09 16:07:24
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-21 16:57:54
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\config\platform.config.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 平台配置
 */

export enum PlatformType {
  CSGOBUY = 'CSGOBUY',
  MARKET = 'MARKET',
  BUFF = 'BUFF'
}

export const platformConfig = {
  /** 平台列表 */
  platforms: [
    {
      type: PlatformType.MARKET,
      name: 'MARKET',
      label: 'MARKET 平台',
      icon: '/images/platform/market.png',
      color: '#52c41a'
    },
    {
      type: PlatformType.CSGOBUY,
      name: 'CSGOBUY',
      label: 'CSGOBUY 平台',
      icon: '/images/platform/csgobuy.png',
      color: '#1890ff'
    },
    {
      type: PlatformType.BUFF,
      name: 'BUFF',
      label: 'BUFF 平台',
      icon: '/images/platform/buff.png',
      color: '#faad14'
    }
  ],

  /** 默认平台 */
  defaultPlatform: PlatformType.MARKET
}

/**
 * 根据类型获取平台配置
 */
export function getPlatformConfig(type: PlatformType) {
  return platformConfig.platforms.find((p) => p.type === type)
}
