<template>
  <view class="page">
    <view class="nav">
      <text class="arr" @tap="shift(-1)">‹</text>
      <text class="ym" @tap="toToday">{{ year }}年{{ month }}月</text>
      <text class="arr" @tap="shift(1)">›</text>
    </view>
    <view class="week">
      <text v-for="w in weeks" :key="w" class="wh">{{ w }}</text>
    </view>
    <view class="grid">
      <view
        v-for="(c, i) in cells"
        :key="i"
        class="cell"
        :class="{
          empty: !c,
          today: c && c.isToday,
          on: c && c.key === selected,
          fest: c && c.lunar && c.lunar.festival,
        }"
        @tap="c && pick(c)"
      >
        <text v-if="c" class="d">{{ c.day }}</text>
        <text v-if="c" class="l">{{ c.mark }}</text>
      </view>
    </view>
    <view v-if="detail" class="card">
      <text class="big">{{ detail.solar }}  {{ detail.week }}</text>
      <text class="sub">{{ detail.lunarLine }}</text>
      <text v-if="detail.festival" class="tag">{{ detail.festival }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { solarToLunar, weekday, daysInMonth, ymd } from '../../utils/lunar.js'

const weeks = ['日', '一', '二', '三', '四', '五', '六']
const weekNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const selected = ref(ymd(now.getFullYear(), now.getMonth() + 1, now.getDate()))

const todayKey = ymd(now.getFullYear(), now.getMonth() + 1, now.getDate())

const cells = computed(() => {
  const y = year.value
  const m = month.value
  const first = weekday(y, m, 1)
  const n = daysInMonth(y, m)
  const arr = []
  for (let i = 0; i < first; i++) arr.push(null)
  for (let d = 1; d <= n; d++) {
    const lunar = solarToLunar(y, m, d)
    const key = ymd(y, m, d)
    arr.push({
      day: d,
      key,
      isToday: key === todayKey,
      lunar,
      mark: lunar ? lunar.festival || lunar.short : '',
    })
  }
  while (arr.length % 7) arr.push(null)
  return arr
})

const detail = computed(() => {
  const [ys, ms, ds] = selected.value.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  if (!y || !m || !d) return null
  const lunar = solarToLunar(y, m, d)
  return {
    solar: y + '年' + m + '月' + d + '日',
    week: weekNames[weekday(y, m, d)],
    lunarLine: lunar
      ? lunar.gzYear + lunar.animal + '年  ' + lunar.text
      : '暂无农历数据',
    festival: lunar && lunar.festival ? lunar.festival : '',
  }
})

function pick(c) {
  selected.value = c.key
}

function shift(delta) {
  let y = year.value
  let m = month.value + delta
  if (m < 1) {
    m = 12
    y -= 1
  }
  if (m > 12) {
    m = 1
    y += 1
  }
  if (y < 1900 || y > 2100) {
    uni.showToast({ title: '仅支持 1900–2100 年', icon: 'none' })
    return
  }
  year.value = y
  month.value = m
}

function toToday() {
  const t = new Date()
  year.value = t.getFullYear()
  month.value = t.getMonth() + 1
  selected.value = todayKey
}
</script>

<style scoped>
.page {
  padding: 16rpx 20rpx 80rpx;
}
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 12rpx 20rpx;
}
.arr {
  width: 72rpx;
  height: 72rpx;
  text-align: center;
  line-height: 64rpx;
  font-size: 56rpx;
  color: #1f1b16;
}
.ym {
  font-size: 34rpx;
  font-weight: 700;
}
.week {
  display: flex;
  padding: 0 6rpx 8rpx;
}
.wh {
  width: 14.28%;
  text-align: center;
  font-size: 22rpx;
  color: #8a8278;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  background: #fffcf8;
  border-radius: 28rpx;
  padding: 12rpx 6rpx 20rpx;
}
.cell {
  width: 14.28%;
  height: 92rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.d {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f1b16;
  line-height: 1.1;
}
.l {
  font-size: 18rpx;
  color: #8a8278;
  margin-top: 4rpx;
  transform: scale(0.92);
}
.today .d {
  color: #0f7a6c;
}
.on {
  background: #1f1b16;
  border-radius: 16rpx;
}
.on .d,
.on .l {
  color: #f6efe4;
}
.fest .l {
  color: #c45c4a;
}
.on.fest .l {
  color: #f3c7be;
}
.card {
  margin-top: 24rpx;
  background: #fffcf8;
  border-radius: 28rpx;
  padding: 32rpx;
}
.big {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}
.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #5c564e;
}
.tag {
  display: inline-block;
  margin-top: 18rpx;
  padding: 8rpx 18rpx;
  background: #fdeeee;
  color: #c45c4a;
  border-radius: 999rpx;
  font-size: 24rpx;
}
</style>
