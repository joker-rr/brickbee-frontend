/*
 * @Author: joker.rrr 
 * @Date: 2025-12-06 21:13:25
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-21 00:45:26
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\utils\format.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * ============================================================================
 * 格式化工具函数
 * ============================================================================
 */

/**
 * 自动*100并规划好
 * @param val - 输入值
 * @returns 处理后的字符串或 '-'
 */
export function toPercentInt(value: string | number | null | undefined): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return `${Math.round(num * 100)}`; // 用 Math.trunc/Math.floor/Math.ceil 可改截断/向下/向上
}


/**
 * 自动处理小数，去除多余的 0（如 7.2000 -> 7.2）
 * @param val - 输入值
 * @returns 处理后的字符串或 '-'
 */
export function autoDecimal(val: string | number | null | undefined): string {
  const num = Number(val);
  return val != null && !isNaN(num) ? num.toString() : '-';
}

/**
 * 将时间转换为"xx小时前"的格式
 * @param time - 时间字符串、时间戳或 Date 对象
 * @returns 格式化后的时间字符串
 */
export function timeAgo(time: string | number | Date | null | undefined): string {
  if (!time) return '-';

  let date: Date;

  if (typeof time === 'string') {
    /**
     * 默认把传入时间视为北京时间（UTC+8）：
     * - 如果是 ISO 字符串且结尾有 Z（UTC），改为 +08:00
     * - 如果是 ISO 且无时区信息，追加 +08:00
     */
    const needsOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(time);
    const normalized = time.endsWith('Z')
      ? time.replace(/Z$/, '+08:00')
      : needsOffset
        ? `${time}+08:00`
        : time;

    // 兼容 ISO8601、普通时间字符串
    date = new Date(normalized);
    if (isNaN(date.getTime())) {
      // Safari 兼容性处理
      date = new Date(normalized.replace(/-/g, '/'));
    }
  } else if (typeof time === 'number') {
    // 10位数字（秒级时间戳），需要乘1000
    if (time.toString().length === 10) {
      date = new Date(time * 1000);
    } else {
      date = new Date(time);
    }
  } else {
    date = new Date(time);
  }

  if (isNaN(date.getTime())) return '-';

  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return diff + '秒前';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}个月前`;
  return `${Math.floor(diff / 31536000)}年前`;
}
