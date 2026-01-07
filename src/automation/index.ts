/**
 * 自动化模块统一导出
 *
 * 使用指南：
 * 1. 任务执行: taskRunner.initialize() + taskRunner.start()
 * 2. 多平台调度: taskScheduler.register() + taskScheduler.start()
 *
 * 注意：
 * - 自动化任务必须在执行会话激活后才能启动
 * - 所有 token 获取都通过 executionSessionManager.getValidToken()
 */

export { taskRunner } from './taskRunner'
export { taskScheduler } from './taskScheduler'

export type {
  TaskStatus,
  TaskConfig,
  TaskLog,
  TaskStats,
  TaskCallbacks,
  ITaskRunner
} from './taskRunner'

export { DEFAULT_TASK_CONFIG } from './engine/types'