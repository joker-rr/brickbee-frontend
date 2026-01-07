/*
 * @Author: joker.rrr 
 * @Date: 2025-12-09 17:09:54
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-20 01:56:06
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\config\env.config.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { z } from 'zod'
import { logger } from '../utils/logger'
/**
 * 环境变量 Schema
 */
const envSchema = z.object({
  // API 配置
  VITE_API_BASE_URL: z
    .string()
    .refine((v) => {
      // 允许 /api 这种相对路径
      if (v.startsWith('/')) return true

      // 允许 http / https 完整 URL
      try {
        new URL(v)
        return true
      } catch {
        return false
      }
    }, {
      message: 'API Base URL 必须是有效的 URL 或以 / 开头的相对路径'
    }),
  VITE_API_TIMEOUT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 30000)),

  // 应用配置
  VITE_APP_TITLE: z.string().optional().transform((v) => v || 'BrickBee'),
  VITE_APP_ENV: z.enum(['development', 'production', 'test']).optional(),

  // 功能开关
  VITE_ENABLE_MOCK: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  VITE_ENABLE_DEVTOOLS: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  // 监控配置（可选）
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_LOGROCKET_APP_ID: z.string().optional(),

  // Steam API（可选）
  VITE_STEAM_API_KEY: z.string().optional()
})

/**
 * 环境变量类型
 */
export type Env = z.infer<typeof envSchema>

/**
 * 验证环境变量
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(import.meta.env)
    logger.log('✅ Environment variables validated successfully')
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('❌ Invalid environment variables:')
      error.issues.forEach((err: any) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    }
    throw new Error('Invalid environment variables')
  }
}

/**
 * 导出验证后的环境变量
 */
export const env = validateEnv()

/**
 * 是否为开发环境
 */
export const isDev = import.meta.env.DEV

/**
 * 是否为生产环境
 */
export const isProd = import.meta.env.PROD

/**
 * 是否为测试环境
 */
export const isTest = import.meta.env.MODE === 'test'
