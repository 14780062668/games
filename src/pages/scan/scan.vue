<template>
  <view class="page">
    <view class="go" hover-class="go-hover" @tap="scan">扫码 / 相册识别</view>
    <view v-if="result" class="res">
      <text class="rlab">识别结果</text>
      <!-- 小程序里裸写 user-select 可能绑定为空字符串失效，显式绑 true -->
      <text class="rtxt" :user-select="true">{{ result }}</text>
      <view class="acts">
        <view class="act" hover-class="act-hover" @tap="copy">复制</view>
      </view>
    </view>
    <view v-if="history.length" class="sec">历史记录</view>
    <view v-for="(h, i) in history" :key="i" class="item" @tap="copyText(h)">
      <text class="htxt">{{ h }}</text>
      <text class="hact">复制</text>
    </view>
    <view v-if="history.length" class="clear" @tap="clearAll">清空历史</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { load, save } from '../../utils/store.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 扫码识别', '/pages/scan/scan')

const KEY = 'tools_scan_v1'
const result = ref('')
const history = ref([])

function reload() {
  const raw = load(KEY, [])
  history.value = Array.isArray(raw) ? raw : []
}

onShow(reload)

function scan() {
  uni.scanCode({
    success: (r) => {
      const text = String(r.result || '')
      if (!text) return
      result.value = text
      // 去重后放最前，最多留 20 条
      const list = [text].concat(history.value.filter((x) => x !== text)).slice(0, 20)
      history.value = list
      save(KEY, list)
    },
    fail: (err) => {
      // 用户主动取消不提示，其余（如 H5 不支持）告知原因
      const msg = String((err && err.errMsg) || '')
      if (/cancel/i.test(msg)) return
      uni.showToast({ title: '当前环境不支持扫码', icon: 'none' })
    },
  })
}

function copy() {
  copyText(result.value)
}

function copyText(t) {
  uni.setClipboardData({ data: t })
}

function clearAll() {
  uni.showModal({
    title: '清空全部历史？',
    success: (r) => {
      if (!r.confirm) return
      history.value = []
      save(KEY, [])
    },
  })
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.go {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background: linear-gradient(135deg, #0bc36a, #059e54);
  box-shadow: 0 6rpx 16rpx rgba(7, 193, 96, 0.25);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}
.go-hover {
  opacity: 0.85;
}
.res {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.rlab {
  display: block;
  font-size: 22rpx;
  color: #969799;
  margin-bottom: 10rpx;
}
.rtxt {
  display: block;
  font-size: 28rpx;
  color: #171a1d;
  word-break: break-all;
  line-height: 1.5;
}
.acts {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
.act {
  padding: 10rpx 32rpx;
  background: #f0f2f5;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #171a1d;
}
.act-hover {
  opacity: 0.7;
}
.sec {
  font-size: 26rpx;
  font-weight: 600;
  color: #646566;
  margin: 8rpx 4rpx 16rpx;
}
.item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 22rpx 24rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.htxt {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: #171a1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hact {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #07c160;
  flex-shrink: 0;
}
.clear {
  text-align: center;
  font-size: 24rpx;
  color: #969799;
  padding: 24rpx 0;
}
</style>
