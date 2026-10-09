<template>
  <view class="home">
    <view class="hero">
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

const tools = [
  { name: '图片压缩', hint: '本地缩小照片体积', path: '/pages/compress/compress', mark: '图', bg: '#5b4b8a', fg: '#f1edfa' },
  { name: '二维码', hint: '文字链接生成二维码', path: '/pages/qr/qr', mark: '码', bg: '#a24b3a', fg: '#fbeeea' },
  { name: '单位换算', hint: '长度重量温度换算', path: '/pages/convert/convert', mark: '换', bg: '#8a6a2f', fg: '#f8f1e0' },
  { name: '时间戳', hint: '时间戳与日期互转', path: '/pages/format/format?tab=time', mark: '转', bg: '#2f6f8a', fg: '#e7f4f8' },
  { name: '计算器', hint: '精准四则运算', path: '/pages/calc/calc', mark: '算', bg: '#1f1b16', fg: '#f6efe4' },
  { name: '记账', hint: '收支一目了然', path: '/pages/ledger/ledger', mark: '账', bg: '#0f7a6c', fg: '#e9f7f4' },
  { name: '待办', hint: '把事记下来', path: '/pages/todo/todo', mark: '待', bg: '#3d6ea8', fg: '#eaf2fb' },
  // #ifdef H5
  { name: 'Word转HTML', hint: 'docx 转网页', path: '/pages/docx/docx', mark: '文', bg: '#6b4c7a', fg: '#f8f1fa' },
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
  padding: 16rpx 24rpx 64rpx;
}
.hero {
  background: linear-gradient(145deg, #2a241e 0%, #1c1915 55%, #1a2824 100%);
  border-radius: 32rpx;
  padding: 32rpx 32rpx 28rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 16rpx 40rpx rgba(28, 25, 21, 0.18);
}
.date {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #f6efe4;
  letter-spacing: 1rpx;
}
.tag {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  padding: 10rpx 18rpx;
  width: fit-content;
  max-width: 100%;
  background: rgba(246, 239, 228, 0.1);
  border-radius: 999rpx;
  border: 1rpx solid rgba(246, 239, 228, 0.12);
}
.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #6ecfbc;
  margin-right: 12rpx;
  flex-shrink: 0;
}
.sub {
  font-size: 22rpx;
  color: rgba(246, 239, 228, 0.72);
  line-height: 1.4;
}
.sec {
  display: flex;
  align-items: center;
  padding: 0 8rpx 20rpx;
}
.sec-t {
  font-size: 28rpx;
  font-weight: 600;
  color: #1c1915;
  padding-left: 16rpx;
  border-left: 6rpx solid #0f7a6c;
}
.grid {
  display: flex;
  flex-direction: column;
}
.card {
  display: flex;
  align-items: center;
  background: #fffdf9;
  border: 1rpx solid rgba(31, 27, 22, 0.05);
  border-radius: 24rpx;
  padding: 22rpx 20rpx 22rpx 22rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 6rpx 20rpx rgba(70, 48, 20, 0.05);
}
.card:last-child {
  margin-bottom: 0;
}
.card-hover {
  background: #f7f1e8;
}
.icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  flex-shrink: 0;
}
.body {
  flex: 1;
  min-width: 0;
  margin: 0 16rpx 0 20rpx;
}
.arrow {
  font-size: 40rpx;
  line-height: 1;
  color: #d0c4b2;
  flex-shrink: 0;
  font-weight: 300;
}
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1c1915;
  line-height: 1.35;
}
.hint {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a8176;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.foot {
  margin-top: 8rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid rgba(31, 27, 22, 0.06);
}
.priv {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #8a8176;
}
</style>
