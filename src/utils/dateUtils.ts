import dayjs from 'dayjs'
import { DaysEvent } from '@/types'

/**
 * 计算距离目标日期还有/已过多少天
 * 返回负值表示还没到（倒数），正值表示已过（正计时）
 */
export function calculateDays(event: DaysEvent): number {
  const target = dayjs(event.date)
  const now = dayjs().startOf('day')

  if (event.type === 'countdown') {
    // 倒数：目标日期 - 今天
    return target.diff(now, 'day')
  } else {
    // 正计时：今天 - 目标日期
    return now.diff(target, 'day')
  }
}

/**
 * 获取显示用的天数文本
 */
export function getDaysText(event: DaysEvent): { number: string; label: string } {
  const days = calculateDays(event)

  if (event.type === 'countdown') {
    if (days < 0) {
      return { number: '0', label: '已过' }
    } else if (days === 0) {
      return { number: '今天', label: '' }
    } else {
      return { number: days.toString(), label: '天' }
    }
  } else {
    if (days < 0) {
      return { number: '0', label: '未开始' }
    } else {
      return { number: days.toString(), label: '天' }
    }
  }
}

/**
 * 格式化日期显示
 */
export function formatDate(dateStr: string): string {
  const d = dayjs(dateStr)
  return d.format('YYYY年MM月DD日')
}

/**
 * 获取目标日期是星期几
 */
export function getWeekday(dateStr: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = dayjs(dateStr)
  return weekdays[d.day()]
}

/**
 * 计算剩余小时/分钟/秒（不到一天时显示）
 */
export function calculateTimeRemaining(event: DaysEvent): string {
  const target = dayjs(event.date + ' ' + (event.time || '23:59'))
  const now = dayjs()
  const diffMs = target.diff(now)

  if (diffMs <= 0) return '00:00:00'

  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)

  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':')
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}
