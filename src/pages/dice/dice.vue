<template>
  <view class="page">
    <view class="header">
      <text class="title">摇色子</text>
      <text class="sub">点击按钮，3秒后出点数</text>
    </view>

    <view class="panel">
      <view class="dice-row">
        <view
          v-for="(n, i) in diceNums"
          :key="'d' + i + '-' + animKey"
          class="dice"
          :class="{ rolling: rolling }"
          :style="{ animationDelay: i * 90 + 'ms' }"
        >
          <view class="face">
            <view
              v-for="dot in 9"
              :key="'dot' + dot"
              class="dot"
              :class="{ on: showDot(n, dot) }"
            />
          </view>
        </view>
      </view>

      <view class="result" v-if="done">
        <text class="sum">总点数：{{ sum }}</text>
      </view>
    </view>

    <button class="btn" size="mini" :disabled="rolling" @tap="shake">
      {{ rolling ? '摇动中...' : '摇一摇' }}
    </button>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'

const diceNums = ref([1, 1, 1])
const rolling = ref(false)
const done = ref(false)
const animKey = ref(0)

const sum = computed(() => diceNums.value[0] + diceNums.value[1] + diceNums.value[2])

function rand6() {
  return ((Math.random() * 6) | 0) + 1
}

function shake() {
  if (rolling.value) return
  rolling.value = true
  done.value = false
  animKey.value += 1

  const timer = setInterval(() => {
    diceNums.value = [rand6(), rand6(), rand6()]
  }, 100)

  setTimeout(() => {
    clearInterval(timer)
    diceNums.value = [rand6(), rand6(), rand6()]
    rolling.value = false
    done.value = true
  }, 3000)
}

function showDot(n, pos) {
  const map = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  }
  return map[n].includes(pos)
}
</script>

<style scoped>
.page {
  padding: 24rpx 18rpx;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f8f8;
}
.header {
  width: 100%;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 18rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 18rpx;
}
.title {
  display: block;
  font-size: 42rpx;
  font-weight: 800;
  color: #111;
  margin-bottom: 8rpx;
}
.sub {
  font-size: 26rpx;
  color: #666;
}
.panel {
  width: 100%;
  background: #fff;
  border-radius: 22rpx;
  padding: 26rpx 20rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
}
.dice-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18rpx;
}
.dice {
  width: 134rpx;
  height: 134rpx;
  border-radius: 22rpx;
  background: linear-gradient(145deg, #ffffff, #f1f5f9);
  box-shadow:
    0 8rpx 20rpx rgba(0, 0, 0, 0.08),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
  padding: 14rpx;
  box-sizing: border-box;
}
.face {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
}
.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: transparent;
}
.dot.on {
  background: #111827;
}
.rolling {
  animation: roll3d 520ms linear infinite;
}
.result {
  margin-top: 22rpx;
  text-align: center;
}
.sum {
  font-size: 34rpx;
  font-weight: 800;
  color: #111;
}
.btn {
  margin-top: 20rpx;
  width: 86%;
  max-width: 520rpx;
  height: 76rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.22);
}
.btn:disabled {
  opacity: 0.7;
}
@keyframes roll3d {
  0% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(90deg) scale(0.92);
  }
  50% {
    transform: rotate(180deg) scale(1.02);
  }
  75% {
    transform: rotate(270deg) scale(0.94);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}
</style>

