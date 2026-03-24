<template>
  <view class="page">
    <view class="header">
      <text class="title">随机双色球</text>
      <view class="sub">不重复抽取：6 红 + 1 蓝</view>
    </view>

    <view class="card" :key="revealKey">
      <text class="label">号码</text>
      <view class="balls one-line">
        <view
          v-for="(n, i) in redText"
          :key="'r' + i"
          class="ball red-ball"
          :style="{ animationDelay: i * 70 + 'ms' }"
        >
          {{ generated ? n : '' }}
        </view>
        <view
          class="ball blue-ball"
          :style="{ animationDelay: '420ms' }"
        >
          {{ generated ? blueText : '' }}
        </view>
      </view>

      <view class="hint" v-if="generated">已生成第 {{ genCount }} 组</view>
    </view>

    <view class="actions">
      <button class="btn primary" size="mini" :disabled="rolling" @tap="generate">
        {{ generated ? '再次生成' : '生成' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const redNums = ref(Array(6).fill(0))
const blueNum = ref(0)
const generated = ref(false)
const rolling = ref(false)
const genCount = ref(0)
const revealKey = ref(0)

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickUniqueRed() {
  const nums = []
  for (let i = 1; i <= 33; i++) nums.push(i)
  shuffle(nums)
  return nums.slice(0, 6).sort((a, b) => a - b)
}

function pickBlue() {
  return ((Math.random() * 16) | 0) + 1
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

const redText = computed(() => redNums.value.map((n) => pad2(n)))
const blueText = computed(() => pad2(blueNum.value))

function generate() {
  if (rolling.value) return
  rolling.value = true
  generated.value = false

  const r = pickUniqueRed()
  const b = pickBlue()

  let t = 0
  const step = 110
  const reveal = () => {
    redNums.value = r
    blueNum.value = b
    genCount.value += 1
    generated.value = true
    revealKey.value += 1
    rolling.value = false
  }

  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      redNums.value[i] = ((Math.random() * 33) | 0) + 1
    }, t)
    t += step
  }
  setTimeout(() => {
    blueNum.value = ((Math.random() * 16) | 0) + 1
  }, t)

  setTimeout(reveal, t + 160)
}
</script>

<style scoped>
.page {
  padding: 24rpx 18rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  background: #f8f8f8;
}
.header {
  width: 100%;
  background: #fff;
  border-radius: 20rpx;
  padding: 26rpx 18rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 18rpx;
  box-sizing: border-box;
}
.title {
  display: block;
  font-size: 42rpx;
  font-weight: 800;
  color: #111;
  margin-bottom: 10rpx;
}
.sub {
  font-size: 26rpx;
  color: #666;
}
.card {
  width: 100%;
  background: #fff;
  border-radius: 22rpx;
  padding: 22rpx 18rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
}
.label {
  font-size: 28rpx;
  color: #333;
  font-weight: 650;
  margin-bottom: 14rpx;
  display: block;
  text-align: center;
}
.balls {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.one-line {
  flex-wrap: nowrap;
  gap: 12rpx;
}
.ball {
  width: 74rpx;
  height: 74rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 900;
  color: #fff;
  box-sizing: border-box;
  opacity: 0;
  transform: translateY(8rpx) scale(0.96);
  animation: popIn 520ms ease forwards;
}
.red-ball {
  background: radial-gradient(circle at 30% 25%, #ff5a5f, #d61f2c 62%, #b0121d);
}
.blue-ball {
  background: radial-gradient(circle at 30% 25%, #3b82f6, #1d4ed8 62%, #1e3a8a);
}
.actions {
  width: 100%;
  margin-top: 18rpx;
  display: flex;
  justify-content: center;
}
.btn {
  width: 86%;
  max-width: 520rpx;
  border: none;
}
.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border-radius: 18rpx;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.22);
}
.primary:disabled {
  opacity: 0.7;
}
.hint {
  margin-top: 18rpx;
  font-size: 26rpx;
  color: #666;
  text-align: center;
}
@keyframes popIn {
  0% {
    opacity: 0;
    transform: translateY(12rpx) scale(0.92);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

