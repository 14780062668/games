import { pad2 } from './fmt.js'

export { pad2 }

// 农历数据 1900-2100
const INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520,
]

const GAN = '甲乙丙丁戊己庚辛壬癸'
const ZHI = '子丑寅卯辰巳午未申酉戌亥'
const ANIMALS = '鼠牛虎兔龙蛇马羊猴鸡狗猪'
const MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

function infoOf(y) {
  return INFO[y - 1900]
}

function leapMonth(y) {
  const v = infoOf(y)
  if (v == null) return 0
  const m = v & 0xf
  return m === 0xf ? 0 : m
}

function leapDays(y) {
  if (!leapMonth(y)) return 0
  return infoOf(y) & 0x10000 ? 30 : 29
}

function monthDays(y, m) {
  const v = infoOf(y)
  if (v == null) return 0
  return v & (0x10000 >> m) ? 30 : 29
}

function yearDays(y) {
  const v = infoOf(y)
  if (v == null) return 0
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += v & i ? 1 : 0
  }
  return sum + leapDays(y)
}

export function solarToLunar(y, m, d) {
  if (y < 1900 || y > 2100 || infoOf(y) == null) return null
  const base = Date.UTC(1900, 0, 31)
  const cur = Date.UTC(y, m - 1, d)
  let offset = Math.floor((cur - base) / 86400000)
  if (offset < 0) return null

  let year = 1900
  let temp = 0
  for (; year < 2101 && offset > 0; year++) {
    temp = yearDays(year)
    offset -= temp
  }
  if (offset < 0) {
    offset += temp
    year--
  }

  const leap = leapMonth(year)
  let isLeap = false
  let month = 1
  for (; month < 13 && offset > 0; month++) {
    if (leap > 0 && month === leap + 1 && !isLeap) {
      month--
      isLeap = true
      temp = leapDays(year)
    } else {
      temp = monthDays(year, month)
    }
    if (isLeap && month === leap + 1) isLeap = false
    offset -= temp
  }
  if (offset === 0 && leap > 0 && month === leap + 1) {
    if (isLeap) isLeap = false
    else {
      isLeap = true
      month--
    }
  }
  if (offset < 0) {
    offset += temp
    month--
  }

  const day = offset + 1
  const gzYear = GAN[(year - 4) % 10] + ZHI[(year - 4) % 12]
  const animal = ANIMALS[(year - 4) % 12]
  const monthName = (isLeap ? '闰' : '') + MONTHS[month - 1] + '月'
  const dayName = DAYS[day - 1]
  const festival = lunarFest(month, day, isLeap) || solarFest(m, d)
  return {
    year,
    month,
    day,
    isLeap,
    gzYear,
    animal,
    monthName,
    dayName,
    text: monthName + dayName,
    short: day === 1 ? monthName : dayName,
    festival,
  }
}

function lunarFest(m, d, leap) {
  if (leap) return ''
  const key = m + '-' + d
  const map = {
    '1-1': '春节',
    '1-15': '元宵',
    '5-5': '端午',
    '7-7': '七夕',
    '8-15': '中秋',
    '9-9': '重阳',
    '12-8': '腊八',
    '12-30': '除夕',
  }
  return map[key] || ''
}

function solarFest(m, d) {
  const key = m + '-' + d
  const map = {
    '1-1': '元旦',
    '2-14': '情人节',
    '3-8': '妇女节',
    '3-12': '植树节',
    '4-1': '愚人节',
    '5-1': '劳动节',
    '5-4': '青年节',
    '6-1': '儿童节',
    '7-1': '建党节',
    '8-1': '建军节',
    '9-10': '教师节',
    '10-1': '国庆',
    '12-25': '圣诞',
  }
  return map[key] || ''
}

export function ymd(y, m, d) {
  return y + '-' + pad2(m) + '-' + pad2(d)
}

export function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate()
}

export function weekday(y, m, d) {
  return new Date(y, m - 1, d).getDay()
}
