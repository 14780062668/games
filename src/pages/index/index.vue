<template>
  <view class="home">
    <view class="hero">
      <text class="hi">{{ hello }}</text>
      <text class="title">随身工具</text>
      <text class="sub">本地计算 · 数据不出手机</text>
    </view>
    <view class="grid">
      <view
        v-for="t in tools"
        :key="t.path"
        class="card"
        hover-class="card-hover"
        @tap="go(t.path)"
      >
        <view class="icon" :style="{ background: t.bg, color: t.fg }">{{ t.mark }}</view>
        <text class="name">{{ t.name }}</text>
        <text class="hint">{{ t.hint }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const hello = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const tools = [
  { name: '计算器', hint: '精准四则运算', path: '/pages/calc/calc', mark: '算', bg: '#1f1b16', fg: '#f6efe4' },
  { name: '记账', hint: '收支一目了然', path: '/pages/ledger/ledger', mark: '账', bg: '#0f7a6c', fg: '#e9f7f4' },
  { name: '待办', hint: '把事记下来', path: '/pages/todo/todo', mark: '待', bg: '#3d6ea8', fg: '#eaf2fb' },
  { name: '日历', hint: '农历节日', path: '/pages/calendar/calendar', mark: '历', bg: '#c45c4a', fg: '#fdeeee' },
  { name: '单位换算', hint: '长度重量温度', path: '/pages/convert/convert', mark: '换', bg: '#8a6a2f', fg: '#f8f1e0' },
  { name: '图片压缩', hint: '缩小体积', path: '/pages/compress/compress', mark: '图', bg: '#5b4b8a', fg: '#f1edfa' },
  { name: '格式转换', hint: '图片时间颜色', path: '/pages/format/format', mark: '转', bg: '#2f6f8a', fg: '#e7f4f8' },
]

function go(url) {
  const opts = Object.create(null)
  opts.url = String(url)
  uni.navigateTo(opts)
}
</script>

<style scoped>
.home {
  padding: 24rpx 32rpx 80rpx;
}
.hero {
  padding: 28rpx 12rpx 40rpx;
}
.hi {
  display: block;
  font-size: 26rpx;
  color: #8a8278;
  letter-spacing: 2rpx;
}
.title {
  display: block;
  margin-top: 8rpx;
  font-size: 56rpx;
  font-weight: 700;
  color: #1f1b16;
  letter-spacing: 2rpx;
}
.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8a8278;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.card {
  width: 48%;
  background: #fffcf8;
  border-radius: 28rpx;
  padding: 32rpx 28rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(80, 60, 30, 0.06);
  box-sizing: border-box;
  cursor: pointer;
}
.card-hover {
  opacity: 0.86;
}
.icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 22rpx;
}
.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1f1b16;
}
.hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8a8278;
}
</style>
