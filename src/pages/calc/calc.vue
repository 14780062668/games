<template>
  <view class="page">
    <view class="screen">
      <text class="expr">{{ expr }}</text>
      <text class="num" :style="{ fontSize: numSize }">{{ display }}</text>
    </view>
    <view class="pad">
      <view
        v-for="k in keys"
        :key="k.id"
        class="key"
        :class="k.cls"
        hover-class="key-hover"
        @tap="press(k)"
      >
        {{ k.label }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'

const display = ref('0')
const acc = ref(null)
const op = ref(null)
const fresh = ref(true)
const expr = ref('')

const keys = [
  { id: 'ac', label: 'AC', cls: 'fn', act: 'ac' },
  { id: 'bk', label: '⌫', cls: 'fn', act: 'bk' },
  { id: 'pc', label: '%', cls: 'fn', act: 'pct' },
  { id: 'div', label: '÷', cls: 'op', act: 'op', v: '/' },
  { id: '7', label: '7', cls: 'n', act: 'd', v: '7' },
  { id: '8', label: '8', cls: 'n', act: 'd', v: '8' },
  { id: '9', label: '9', cls: 'n', act: 'd', v: '9' },
  { id: 'mul', label: '×', cls: 'op', act: 'op', v: '*' },
  { id: '4', label: '4', cls: 'n', act: 'd', v: '4' },
  { id: '5', label: '5', cls: 'n', act: 'd', v: '5' },
  { id: '6', label: '6', cls: 'n', act: 'd', v: '6' },
  { id: 'sub', label: '−', cls: 'op', act: 'op', v: '-' },
  { id: '1', label: '1', cls: 'n', act: 'd', v: '1' },
  { id: '2', label: '2', cls: 'n', act: 'd', v: '2' },
  { id: '3', label: '3', cls: 'n', act: 'd', v: '3' },
  { id: 'add', label: '+', cls: 'op', act: 'op', v: '+' },
  { id: 'sg', label: '±', cls: 'n', act: 'sign' },
  { id: '0', label: '0', cls: 'n', act: 'd', v: '0' },
  { id: 'dot', label: '.', cls: 'n', act: 'd', v: '.' },
  { id: 'eq', label: '=', cls: 'eq', act: 'eq' },
]

const numSize = computed(() => {
  const n = String(display.value).length
  if (n > 14) return '44rpx'
  if (n > 11) return '56rpx'
  if (n > 8) return '68rpx'
  return '84rpx'
})

function parseNum(s) {
  if (s === '出错') return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

function formatNum(n) {
  if (!Number.isFinite(n)) return '出错'
  const r = Math.round(n * 1e12) / 1e12
  if (Object.is(r, -0)) return '0'
  const abs = Math.abs(r)
  if (abs >= 1e12) return r.toExponential(6).replace(/\.?0+e/, 'e')
  let s = String(r)
  if (s.includes('e')) return s
  if (s.length > 14) s = r.toPrecision(10).replace(/\.?0+e/, 'e')
  if (s.includes('.') && !s.includes('e')) s = s.replace(/\.?0+$/, '')
  return s || '0'
}

function digitCount(s) {
  return s.replace('-', '').replace('.', '').length
}

function compute(a, operator, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN
  if (operator === '/' && b === 0) return NaN
  let r = 0
  if (operator === '+') r = a + b
  else if (operator === '-') r = a - b
  else if (operator === '*') r = a * b
  else if (operator === '/') r = a / b
  else return NaN
  return Math.round(r * 1e12) / 1e12
}

function opLabel(v) {
  return { '+': '+', '-': '−', '*': '×', '/': '÷' }[v] || v
}

function resetAll() {
  display.value = '0'
  acc.value = null
  op.value = null
  fresh.value = true
  expr.value = ''
}

function press(k) {
  if (display.value === '出错' && k.act !== 'ac') {
    resetAll()
    if (k.act !== 'd') return
  }
  if (k.act === 'ac') {
    resetAll()
    return
  }
  if (k.act === 'd') {
    inputDigit(k.v)
    return
  }
  if (k.act === 'bk') {
    if (fresh.value) return
    const s = display.value
    if (s.length <= 1 || (s.length === 2 && s[0] === '-')) {
      display.value = '0'
      fresh.value = true
      return
    }
    display.value = s.slice(0, -1)
    return
  }
  if (k.act === 'sign') {
    if (display.value === '0' || display.value === '出错') return
    display.value = display.value.startsWith('-')
      ? display.value.slice(1)
      : '-' + display.value
    return
  }
  if (k.act === 'pct') {
    const n = parseNum(display.value)
    if (!Number.isFinite(n)) return
    display.value = formatNum(n / 100)
    fresh.value = true
    return
  }
  if (k.act === 'op') {
    setOp(k.v)
    return
  }
  if (k.act === 'eq') equals()
}

function inputDigit(d) {
  if (fresh.value) {
    display.value = d === '.' ? '0.' : d
    fresh.value = false
    return
  }
  if (d === '.' && display.value.includes('.')) return
  if (digitCount(display.value) >= 12 && d !== '.') return
  if (display.value === '0' && d !== '.') {
    display.value = d
    return
  }
  if (display.value === '-0' && d !== '.') {
    display.value = '-' + d
    return
  }
  display.value += d
}

function setOp(next) {
  const cur = parseNum(display.value)
  if (!Number.isFinite(cur)) {
    display.value = '出错'
    return
  }
  if (acc.value !== null && op.value && !fresh.value) {
    const r = compute(acc.value, op.value, cur)
    display.value = formatNum(r)
    acc.value = r
  } else {
    acc.value = cur
  }
  op.value = next
  fresh.value = true
  expr.value = formatNum(acc.value) + ' ' + opLabel(next)
}

function equals() {
  if (op.value === null || acc.value === null) return
  const cur = parseNum(display.value)
  const r = compute(acc.value, op.value, cur)
  expr.value = formatNum(acc.value) + ' ' + opLabel(op.value) + ' ' + formatNum(cur) + ' ='
  display.value = formatNum(r)
  acc.value = null
  op.value = null
  fresh.value = true
}
</script>

<style scoped>
.page {
  min-height: 100%;
  padding: 24rpx 28rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.screen {
  background: #1f1b16;
  border-radius: 32rpx;
  padding: 36rpx 36rpx 28rpx;
  min-height: 220rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  margin-bottom: 28rpx;
}
.expr {
  min-height: 40rpx;
  font-size: 26rpx;
  color: rgba(246, 239, 228, 0.55);
  margin-bottom: 12rpx;
}
.num {
  color: #f6efe4;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  word-break: break-all;
  text-align: right;
  line-height: 1.15;
}
.pad {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.key {
  width: 23%;
  height: 112rpx;
  margin-bottom: 16rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  background: #fffcf8;
  color: #1f1b16;
  box-shadow: 0 8rpx 20rpx rgba(80, 60, 30, 0.05);
}
.key-hover {
  opacity: 0.75;
}
.fn {
  background: #ebe4d8;
  color: #5c564e;
  font-size: 34rpx;
}
.op {
  background: #0f7a6c;
  color: #f3fffc;
}
.eq {
  background: #c45c4a;
  color: #fff7f5;
}
</style>
