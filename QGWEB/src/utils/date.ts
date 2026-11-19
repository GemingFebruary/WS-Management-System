/**
 * 日期格式化工具
 * 兼容微信云数据库返回的多种日期格式
 */

/**
 * 将任意日期值格式化为 YYYY-MM-DD 字符串
 *
 * 支持的输入格式：
 *  - 字符串 "2026-06-10T12:00:00Z" → "2026-06-10"
 *  - MongoDB 扩展 JSON { $date: 1781083175517 } → "2026-06-10"
 *  - Date 对象
 *  - 毫秒时间戳数字
 */
export function formatDate(date: unknown): string {
  if (!date) return ''

  // 字符串：直接截取日期部分
  if (typeof date === 'string') {
    return date.substring(0, 10)
  }

  // MongoDB 扩展 JSON { $date: <ms> }
  if (typeof date === 'object' && date !== null && '$date' in date) {
    return new Date((date as { $date: number }).$date).toISOString().substring(0, 10)
  }

  // Date 对象
  if (date instanceof Date) {
    return date.toISOString().substring(0, 10)
  }

  // 数字时间戳
  if (typeof date === 'number') {
    return new Date(date).toISOString().substring(0, 10)
  }

  // 兜底
  try {
    return new Date(date as string).toISOString().substring(0, 10)
  } catch {
    return String(date)
  }
}

/**
 * 将任意日期值格式化为 YYYY-MM-DD HH:mm 字符串
 */
export function formatDateTime(date: unknown): string {
  if (!date) return ''

  let d: Date | null = null

  if (typeof date === 'string') {
    d = new Date(date)
  } else if (typeof date === 'object' && date !== null && '$date' in date) {
    d = new Date((date as { $date: number }).$date)
  } else if (date instanceof Date) {
    d = date
  } else if (typeof date === 'number') {
    d = new Date(date)
  }

  if (!d || isNaN(d.getTime())) return String(date)

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}
