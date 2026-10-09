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
      <!-- #ifdef MP-WEIXIN -->
      <button class="btn solid share" open-type="share" hover-class="btn-hover">转发给朋友</button>
      <!-- #endif -->
    </view>
    <canvas type="2d" id="qrCanvas" class="offscreen" />
  </view>
</template>

<script setup>
import { getCurrentInstance, ref } from 'vue'
import { onHide } from '@dcloudio/uni-app'
import { saveOrDownload } from '../../utils/image.js'
import { renderQr } from '../../utils/qr.js'
import { ensureSafeMsg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

const text = ref('')
const img = ref('')
const busy = ref(false)
const inst = getCurrentInstance()
const proxy = inst && inst.proxy

useShare('瘦图盒 · 二维码生成', '/pages/qr/qr', () => img.value)

function hideLoading() {
  uni.hideLoading()
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
    img.value = await renderQr(raw, proxy)
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
  background: #fffdf9;
  border: 1rpx solid rgba(31, 27, 22, 0.06);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 28rpx rgba(70, 48, 20, 0.04);
}
.lab {
  display: block;
  font-size: 24rpx;
  color: #8a8176;
  margin-bottom: 12rpx;
}
.area {
  width: 100%;
  height: 200rpx;
  background: #f4efe6;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #1c1915;
}
.preview {
  width: 100%;
  height: 520rpx;
  background: #ffffff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(31, 27, 22, 0.06);
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
.share {
  width: 100%;
  margin-top: 16rpx;
}
.offscreen {
  position: fixed;
  left: -9999px;
  width: 10px;
  height: 10px;
}
</style>
