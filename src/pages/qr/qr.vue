<template>
  <view class="page">
    <view class="card">
      <text class="lab">文字或链接</text>
      <textarea
        class="area"
        :value="text"
        placeholder="输入要生成二维码的内容"
        maxlength="500"
        @input="onInput"
      />
      <view class="btn solid" hover-class="btn-hover" @tap="run">生成</view>
    </view>
    <view v-if="img" class="card">
      <image class="preview" :src="img" mode="aspectFit" />
      <view class="btn solid" hover-class="btn-hover" @tap="save">保存到相册</view>
    </view>
    <canvas type="2d" id="qrCanvas" class="offscreen" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onHide } from '@dcloudio/uni-app'
import { saveOrDownload } from '../../utils/image.js'
import { renderQr } from '../../utils/qr.js'
import { ensureSafeMsg } from '../../utils/secCheck.js'

const text = ref('')
const img = ref('')
const busy = ref(false)

function hideLoading() {
  setTimeout(() => uni.hideLoading(), 50)
}

onHide(() => {
  uni.hideLoading()
})

function onInput(e) {
  text.value = String(e.detail.value || '').slice(0, 500)
}

async function run() {
  const raw = text.value.trim()
  if (!raw) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  if (busy.value) return
  busy.value = true
  try {
    const ok = await ensureSafeMsg(raw)
    if (!ok) return
    // H5 的 showLoading 关不掉，生成又是同步的，只在小程序里提示
    // #ifndef H5
    uni.showLoading({ title: '生成中', mask: true })
    // #endif
    img.value = await renderQr(raw)
    // #ifndef H5
    hideLoading()
    // #endif
  } catch (e) {
    // #ifndef H5
    hideLoading()
    // #endif
    uni.showToast({ title: (e && e.message) || '生成失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

function save() {
  if (!img.value) return
  saveOrDownload(img.value, 'qrcode.png')
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.card {
  background: #fffcf8;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}
.lab {
  display: block;
  font-size: 24rpx;
  color: #8a8278;
  margin-bottom: 12rpx;
}
.area {
  width: 100%;
  height: 200rpx;
  background: #f3efe8;
  border-radius: 16rpx;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #1f1b16;
}
.preview {
  width: 100%;
  height: 520rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}
.btn {
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
  margin-top: 20rpx;
}
.solid {
  background: #a24b3a;
  color: #fbeeea;
}
.btn-hover {
  opacity: 0.85;
}
.offscreen {
  position: fixed;
  left: -9999px;
  width: 10px;
  height: 10px;
}
</style>
