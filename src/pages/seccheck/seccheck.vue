<template>
  <view class="page">
    <text class="tip">按审核要求演示内容安全接口调用，下方展示接口返回值</text>

    <view class="card">
      <text class="lab">msgSecCheck 文本检测</text>
      <input class="inp" :value="msg" maxlength="200" placeholder="输入待检测文本" @input="onMsg" />
      <view class="btn" @tap="runMsg">调用 msgSecCheck</view>
    </view>

    <view class="card">
      <text class="lab">imgSecCheck / mediaCheckAsync</text>
      <view class="btn ghost" @tap="pick">选择图片</view>
      <image v-if="img" class="preview" :src="img" mode="aspectFit" />
      <view class="row">
        <view class="btn half" @tap="runImg">调用 imgSecCheck</view>
        <view class="btn half" @tap="runMedia">调用 mediaCheckAsync</view>
      </view>
    </view>

    <view v-if="result" class="card">
      <text class="lab">接口返回值（请录屏）</text>
      <text class="raw">{{ result }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onHide } from '@dcloudio/uni-app'
import { pickImage } from '../../utils/image.js'
import { checkMsg, checkImg, checkMedia, initCloud } from '../../utils/secCheck.js'

try {
  initCloud()
} catch (e) {}

const msg = ref('你好，这是一条安全检测示例')
const img = ref('')
const result = ref('')

onHide(() => {
  uni.hideLoading()
})

function onMsg(e) {
  msg.value = String(e.detail.value || '').slice(0, 200)
}

function showRaw(r) {
  try {
    result.value = JSON.stringify(r, null, 2)
  } catch (e) {
    result.value = String(r)
  }
}

async function runMsg() {
  uni.showLoading({ title: '检测中', mask: true })
  try {
    const r = await checkMsg(msg.value)
    uni.hideLoading()
    showRaw(r)
    uni.showToast({ title: r.ok ? '检测通过' : '未通过', icon: 'none' })
  } catch (e) {
    uni.hideLoading()
    showRaw({ ok: false, err: (e && e.message) || 'fail' })
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  }
}

async function pick() {
  try {
    img.value = await pickImage()
  } catch (e) {
    if (e && e.message === 'cancel') return
    uni.showToast({ title: (e && e.message) || '选择失败', icon: 'none' })
  }
}

async function runImg() {
  if (!img.value) {
    uni.showToast({ title: '请先选图', icon: 'none' })
    return
  }
  uni.showLoading({ title: 'imgSecCheck', mask: true })
  try {
    const r = await checkImg(img.value)
    uni.hideLoading()
    showRaw(r)
    uni.showToast({ title: r.ok ? '检测通过' : '未通过', icon: 'none' })
  } catch (e) {
    uni.hideLoading()
    showRaw({ ok: false, err: (e && e.message) || 'fail' })
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  }
}

async function runMedia() {
  if (!img.value) {
    uni.showToast({ title: '请先选图', icon: 'none' })
    return
  }
  uni.showLoading({ title: 'mediaCheckAsync', mask: true })
  try {
    const r = await checkMedia(img.value)
    uni.hideLoading()
    showRaw(r)
    uni.showToast({ title: r.ok ? '已提交异步检测' : '未通过', icon: 'none' })
  } catch (e) {
    uni.hideLoading()
    showRaw({ ok: false, err: (e && e.message) || 'fail' })
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  }
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.tip {
  display: block;
  font-size: 24rpx;
  color: #8a8278;
  margin-bottom: 20rpx;
  line-height: 1.5;
}
.card {
  background: #fffcf8;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}
.lab {
  display: block;
  font-size: 26rpx;
  color: #5c564e;
  margin-bottom: 16rpx;
  font-weight: 600;
}
.inp {
  background: #f3efe8;
  border-radius: 16rpx;
  height: 80rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}
.btn {
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
  background: #5b4b8a;
  color: #f6f2ff;
  margin-top: 12rpx;
}
.btn.ghost {
  background: #efe8dc;
  color: #1f1b16;
}
.row {
  display: flex;
  gap: 16rpx;
}
.half {
  flex: 1;
}
.preview {
  width: 100%;
  height: 240rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
  background: #efe8dc;
}
.raw {
  display: block;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 22rpx;
  line-height: 1.5;
  color: #1f1b16;
  background: #f3efe8;
  padding: 20rpx;
  border-radius: 12rpx;
}
</style>
