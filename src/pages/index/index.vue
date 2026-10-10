<template>
  <view class="home">
    <view class="hero">
      <view class="hero-deco a" />
      <view class="hero-deco b" />
      <text class="hello">{{ greetText }}</text>
      <text class="date">{{ dateText }}</text>
      <view class="tag">
        <view class="dot" />
        <text class="sub">本地计算 · 数据不出手机</text>
      </view>
    </view>
    <view class="sec">
      <text class="sec-t">全部工具</text>
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
        <view class="body">
          <text class="name">{{ t.name }}</text>
          <text class="hint">{{ t.hint }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
    <view class="foot">
      <text class="priv" @tap="go('/pages/privacy/privacy')">隐私政策</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 图片压缩、二维码、时间戳', '/pages/index/index')

const dateText = computed(() => {
  const d = new Date()
  const w = ['日', '一', '二', '三', '四', '五', '六']
  return d.getMonth() + 1 + '月' + d.getDate() + '日 周' + w[d.getDay()]
})

// 按时段问候
const greetText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const tools = [
  { name: '图片压缩', hint: '本地缩小照片体积', path: '/pages/compress/compress', mark: '图', bg: '#e8f3ff', fg: '#0b6bcb' },
  { name: '二维码', hint: '文字链接生成二维码', path: '/pages/qr/qr', mark: '码', bg: '#fff1e6', fg: '#c2410c' },
  { name: '单位换算', hint: '长度重量温度换算', path: '/pages/convert/convert', mark: '换', bg: '#f3e8ff', fg: '#7c3aed' },
  { name: '时间戳', hint: '时间戳与日期互转', path: '/pages/format/format?tab=time', mark: '转', bg: '#e6f9f0', fg: '#059669' },
  { name: '计算器', hint: '精准四则运算', path: '/pages/calc/calc', mark: '算', bg: '#f1f2f4', fg: '#171a1d' },
  { name: '记账', hint: '收支一目了然', path: '/pages/ledger/ledger', mark: '账', bg: '#e0f2f1', fg: '#0f766e' },
  { name: '待办', hint: '把事记下来', path: '/pages/todo/todo', mark: '待', bg: '#e8f0fe', fg: '#1d4ed8' },
  { name: '倒数日', hint: '重要日子倒计时', path: '/pages/days/days', mark: '日', bg: '#fff7e6', fg: '#d48806' },
  { name: '随机转盘', hint: '帮你做个决定', path: '/pages/wheel/wheel', mark: '转', bg: '#ffe4e6', fg: '#e11d48' },
  { name: '手持弹幕', hint: '全屏滚动大字', path: '/pages/barrage/barrage', mark: '幕', bg: '#171a1d', fg: '#07c160' },
  { name: '扫码识别', hint: '扫二维码条形码', path: '/pages/scan/scan', mark: '扫', bg: '#eef2ff', fg: '#4f46e5' },
  // #ifdef H5
  { name: 'Word转HTML', hint: 'docx 转网页', path: '/pages/docx/docx', mark: '文', bg: '#fdf2f8', fg: '#be185d' },
  // #endif
]

function go(url) {
  const opts = Object.create(null)
  opts.url = String(url)
  uni.navigateTo(opts)
}
</script>

<style scoped>
.home {
  padding: 20rpx 28rpx 64rpx;
}
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0bc36a 0%, #059e54 100%);
  border-radius: 28rpx;
  padding: 40rpx 32rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 12rpx 28rpx rgba(7, 193, 96, 0.28);
}
/* 装饰光斑，增加层次 */
.hero-deco {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}
.hero-deco.a {
  width: 240rpx;
  height: 240rpx;
  right: -70rpx;
  top: -90rpx;
}
.hero-deco.b {
  width: 140rpx;
  height: 140rpx;
  right: 70rpx;
  bottom: -60rpx;
}
.hello {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1rpx;
}
.date {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0;
}
.tag {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  padding: 10rpx 20rpx;
  width: fit-content;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
}
.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #a7f3d0;
  margin-right: 10rpx;
  flex-shrink: 0;
}
.sub {
  font-size: 22rpx;
  color: #ffffff;
  line-height: 1.4;
}
.sec {
  display: flex;
  align-items: center;
  padding: 0 4rpx 18rpx;
}
.sec-t {
  font-size: 28rpx;
  font-weight: 600;
  color: #171a1d;
  padding-left: 14rpx;
  border-left: 6rpx solid #07c160;
}
.grid {
  display: flex;
  flex-direction: column;
}
.card {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: none;
  border-radius: 24rpx;
  padding: 26rpx 24rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 4rpx 16rpx rgba(23, 26, 29, 0.06);
  transition: transform 0.15s ease;
}
.card:last-child {
  margin-bottom: 0;
}
.card-hover {
  background: #f7f8fa;
  transform: scale(0.985);
}
.icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.body {
  flex: 1;
  min-width: 0;
  margin: 0 14rpx 0 20rpx;
}
.arrow {
  font-size: 34rpx;
  line-height: 1;
  color: #c8c9cc;
  flex-shrink: 0;
  font-weight: 300;
}
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #171a1d;
  line-height: 1.35;
}
.hint {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #969799;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.foot {
  margin-top: 12rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #ebedf0;
}
.priv {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #969799;
}
</style>
