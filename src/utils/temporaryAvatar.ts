/*
 * @Author: joker.rrr 
 * @Date: 2025-12-13 04:50:45
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-13 04:52:16
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\utils\temporaryAvatar.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 随机头像生成器
 *
 * 提供多种方案生成随机头像
 */

/**
 * 方案1：使用 DiceBear API (推荐，最简单)
 *
 * 优点：
 * - 完全免费，无需依赖
 * - 支持多种风格
 * - 生成速度快
 * - 可离线使用（下载后）
 *
 * @param seed - 种子值（相同种子生成相同头像）
 * @param style - 头像风格
 * @returns 头像 URL
 */
export function generateAvatarByDiceBear(
    seed: string = Math.random().toString(),
    style: 'adventurer' | 'avataaars' | 'bottts' | 'croodles' | 'identicon' | 'lorelei' | 'micah' | 'pixel-art' = 'adventurer'
): string {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}
