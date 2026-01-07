/**
 * ============================================================================
 * 文件名：index.ts
 * 位置：src/components/base/index.ts
 * 作用：基础组件统一导出
 * 为什么需要：
 *   1. 统一导出入口
 *   2. 方便组件引用
 *   3. 支持全局注册
 * ============================================================================
 */

export { default as BaseButton } from './Button.vue'
export { default as BaseCard } from './Card.vue'
export { default as BaseInput } from './Input.vue'
export { default as BaseModal } from './Modal.vue'

// 导出类型
export type { ButtonType, ButtonSize } from './Button.vue'
export type { CardShadow } from './Card.vue'
export type { InputType, InputSize } from './Input.vue'
