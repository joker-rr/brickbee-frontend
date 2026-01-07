/*
 * @Author: joker.rrr
 * @Date: 2025-12-02 22:34:29
 * @LastEditors: joker.rrr
 * @LastEditTime: 2025-12-09
 * @FilePath: \brickbee-frontend-ts\src\api\modules\system\types.ts
 * @Description: 系统相关类型定义
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

/**
 * 系统配置
 */
export interface SystemConfig {
  siteName: string
  version: string
  maintenance: boolean
}

/**
 * 字典项
 */
export interface DictItem {
  label: string
  value: string | number
}
