<template>
  <view class="page">
    <view class="cats">
      <view
        v-for="c in cats"
        :key="c.id"
        class="cat"
        :class="{ on: cat === c.id }"
        @tap="switchCat(c.id)"
      >
        {{ c.name }}
      </view>
    </view>

    <view class="card">
      <view class="field">
        <text class="lab">从</text>
        <picker :range="labels" :value="fromIdx" @change="onFrom">
          <view class="pick">{{ labels[fromIdx] }}</view>
        </picker>
        <input class="inp" :type="cat === 'temp' ? 'text' : 'digit'" :value="input" placeholder="输入数值" @input="onInput" />
      </view>
      <view class="swap" hover-class="swap-hover" @tap="swap">
        <text class="swap-ico">⇅</text>
        <text>互换</text>
      </view>
      <view class="field">
        <text class="lab">到</text>
        <picker :range="labels" :value="toIdx" @change="onTo">
          <view class="pick">{{ labels[toIdx] }}</view>
        </picker>
        <view class="out">{{ output || '—' }}</view>
      </view>
    </view>
    <text class="tip">温度可输入负数；其他单位仅支持非负数。</text>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 单位换算', '/pages/convert/convert')

const cats = [
  { id: 'len', name: '长度' },
  { id: 'wt', name: '重量' },
  { id: 'temp', name: '温度' },
  { id: 'area', name: '面积' },
  { id: 'vol', name: '体积' },
  { id: 'spd', name: '速度' },
  { id: 'time', name: '时间' },
  { id: 'data', name: '数据' },
]

const tables = {
  len: [
    { name: '米', k: 1 },
    { name: '千米', k: 1000 },
    { name: '厘米', k: 0.01 },
    { name: '毫米', k: 0.001 },
    { name: '英里', k: 1609.344 },
    { name: '码', k: 0.9144 },
    { name: '英尺', k: 0.3048 },
    { name: '英寸', k: 0.0254 },
  ],
  wt: [
    { name: '千克', k: 1 },
    { name: '克', k: 0.001 },
    { name: '吨', k: 1000 },
    { name: '斤', k: 0.5 },
    { name: '磅', k: 0.45359237 },
    { name: '盎司', k: 0.028349523125 },
  ],
  temp: [
    { name: '摄氏度', k: 'C' },
    { name: '华氏度', k: 'F' },
    { name: '开尔文', k: 'K' },
  ],
  area: [
    { name: '平方米', k: 1 },
    { name: '平方千米', k: 1e6 },
    { name: '公顷', k: 10000 },
    { name: '亩', k: 666.666666667 },
    { name: '平方英尺', k: 0.09290304 },
  ],
  vol: [
    { name: '升', k: 1 },
    { name: '毫升', k: 0.001 },
    { name: '立方米', k: 1000 },
    { name: '加仑(美)', k: 3.785411784 },
  ],
  spd: [
    { name: '米/秒', k: 1 },
    { name: '千米/时', k: 1000 / 3600 },
    { name: '英里/时', k: 1609.344 / 3600 },
  ],
  time: [
    { name: '秒', k: 1 },
    { name: '分钟', k: 60 },
    { name: '小时', k: 3600 },
    { name: '天', k: 86400 },
  ],
  data: [
    { name: 'B', k: 1 },
    { name: 'KB', k: 1024 },
    { name: 'MB', k: 1048576 },
    { name: 'GB', k: 1073741824 },
    { name: 'TB', k: 1099511627776 },
  ],
}

const cat = ref('len')
const fromIdx = ref(0)
const toIdx = ref(1)
const input = ref('1')

const units = computed(() => tables[cat.value])
const labels = computed(() => units.value.map((u) => u.name))

function toC(val, k) {
  if (k === 'C') return val
  if (k === 'F') return ((val - 32) * 5) / 9
  if (k === 'K') return val - 273.15
  return NaN
}

function fromC(c, k) {
  if (k === 'C') return c
  if (k === 'F') return (c * 9) / 5 + 32
  if (k === 'K') return c + 273.15
  return NaN
}

function pretty(n) {
  if (!Number.isFinite(n)) return ''
  const abs = Math.abs(n)
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-8)) {
    return n.toExponential(6).replace(/\.?0+e/, 'e')
  }
  let s = String(Math.round(n * 1e10) / 1e10)
  if (s.includes('.')) s = s.replace(/\.?0+$/, '')
  return s
}

const output = computed(() => {
  const raw = input.value.trim()
  if (!raw || raw === '-' || raw === '.' || raw === '-.') return ''
  const n = Number(raw)
  if (!Number.isFinite(n)) return '无效数字'
  const list = units.value
  const a = list[fromIdx.value]
  const b = list[toIdx.value]
  if (!a || !b) return ''
  if (cat.value !== 'temp' && n < 0) return '不能为负'
  if (cat.value === 'temp') {
    const c = toC(n, a.k)
    if (a.k === 'K' && n < 0) return '开尔文不能为负'
    // 低于 -273.15℃ 没有物理意义
    if (!Number.isFinite(c) || c < -273.15) return '低于绝对零度'
    return pretty(fromC(c, b.k))
  }
  return pretty((n * a.k) / b.k)
})

function switchCat(id) {
  cat.value = id
  fromIdx.value = 0
  toIdx.value = Math.min(1, tables[id].length - 1)
  input.value = cat.value === 'temp' ? '0' : '1'
}

function onFrom(e) {
  fromIdx.value = Number(e.detail.value)
}

function onTo(e) {
  toIdx.value = Number(e.detail.value)
}

function onInput(e) {
  let v = String(e.detail.value || '')
  if (cat.value === 'temp') {
    v = v.replace(/[^\d.\-]/g, '')
    if (v.indexOf('-') > 0) v = v.replace(/-/g, '')
    if ((v.match(/-/g) || []).length > 1) v = '-' + v.replace(/-/g, '')
  } else {
    v = v.replace(/[^\d.]/g, '')
  }
  const i = v.indexOf('.')
  if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '')
  // 过滤后和原值相同，输入框不会刷新，先写入再改回
  if (v === input.value && String(e.detail.value || '') !== v) {
    input.value = v + ' '
    nextTick(() => {
      input.value = v
    })
    return
  }
  input.value = v
}

function swap() {
  const bad = ['无效数字', '不能为负', '开尔文不能为负', '低于绝对零度']
  // 必须先记下结果。改了单位之后，计算结果会立刻跟着变
  const prev = output.value
  const i = fromIdx.value
  fromIdx.value = toIdx.value
  toIdx.value = i
  if (prev && !bad.includes(prev)) input.value = prev
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.cats {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}
.cat {
  padding: 12rpx 24rpx;
  background: #f2f3f5;
  color: #646566;
  border-radius: 999rpx;
  font-size: 24rpx;
  margin: 0 12rpx 12rpx 0;
}
.cat.on {
  background: #171a1d;
  color: #ffffff;
}
.card {
  background: #ffffff;
  border: none;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}
.field {
  background: #f6f7f9;
  border-radius: 16rpx;
  padding: 22rpx 24rpx 18rpx;
}
.lab {
  font-size: 22rpx;
  color: #8a8176;
}
.pick {
  margin-top: 8rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #07c160;
}
.inp,
.out {
  margin-top: 12rpx;
  font-size: 40rpx;
  font-weight: 700;
  height: 64rpx;
  line-height: 64rpx;
}
.out {
  color: #1f1b16;
  word-break: break-all;
}
.swap {
  width: 168rpx;
  margin: 18rpx auto;
  height: 64rpx;
  border-radius: 999rpx;
  background: #171a1d;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
.swap-ico {
  margin-right: 8rpx;
  font-size: 26rpx;
}
.swap-hover {
  opacity: 0.82;
}
.tip {
  display: block;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #8a8176;
  padding: 0 8rpx;
}
</style>
