<template>
  <view class="page">
    <view class="card" @tap="choose">
      <image v-if="src" class="preview" :src="src" mode="aspectFit" />
      <view v-else class="ph">
        <text class="plus">＋</text>
        <text>点击从相册选择</text>
      </view>
    </view>

    <view v-if="src" class="card info">
      <view class="line">
        <text>原图</text>
        <text>{{ fmtSize(originSize) }}</text>
      </view>
      <view class="line">
        <text>质量 {{ quality }}%</text>
        <text v-if="outSize">约 {{ fmtSize(outSize) }}</text>
      </view>
      <slider
        :value="quality"
        min="10"
        max="90"
        step="5"
        activeColor="#5b4b8a"
        backgroundColor="#e7e0d6"
        block-size="18"
        @changing="onSlide"
        @change="onSlide"
      />
      <view class="btns">
        <view class="btn ghost" @tap="choose">重选</view>
        <view class="btn solid" hover-class="btn-hover" @tap="run">压缩</view>
      </view>
    </view>

    <view v-if="out" class="card">
      <image class="preview sm" :src="out" mode="aspectFit" />
      <view class="btn solid" hover-class="btn-hover" @tap="save">保存图片</view>
      <!-- #ifdef MP-WEIXIN -->
      <button class="btn solid share" open-type="share" hover-class="btn-hover">转发给朋友</button>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onHide } from '@dcloudio/uni-app'
import { pickImage, getFileSize, compressToJpeg, saveOrDownload, fmtSize } from '../../utils/image.js'
import { ensureSafeImg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 图片压缩', '/pages/compress/compress', () => out.value)

const src = ref('')
const originSize = ref(0)
const quality = ref(70)
const out = ref('')
const outSize = ref(0)
const busy = ref(false)

function hideLoading() {
  uni.hideLoading()
}

onHide(() => {
  uni.hideLoading()
})

function onSlide(e) {
  quality.value = Number(e.detail.value)
}

async function choose() {
  try {
    const path = await pickImage()
    // 先展示再检测，避免审核时白屏/无数据
    src.value = path
    out.value = ''
    outSize.value = 0
    originSize.value = await getFileSize(path)
    const ok = await ensureSafeImg(path)
    if (!ok) {
      src.value = ''
      originSize.value = 0
    }
  } catch (e) {
    if (e && e.message === 'cancel') return
    uni.showToast({ title: (e && e.message) || '选择失败', icon: 'none' })
  }
}

async function run() {
  if (!src.value || busy.value) return
  busy.value = true
  uni.showLoading({ title: '压缩中', mask: true })
  try {
    const r = await compressToJpeg(src.value, quality.value)
    out.value = r.path
    outSize.value = r.size
    hideLoading()
    if (originSize.value && r.size >= originSize.value) {
      uni.showToast({ title: '已处理，体积未明显变小', icon: 'none' })
    } else {
      uni.showToast({ title: '压缩完成', icon: 'none' })
    }
  } catch (e) {
    hideLoading()
    uni.showToast({ title: (e && e.message) || '压缩失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

function save() {
  if (!out.value) return
  saveOrDownload(out.value, 'compressed.jpg')
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.card {
  background: #ffffff;
  border: none;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}
.preview {
  width: 100%;
  height: 360rpx;
  border-radius: 12rpx;
  background: #f2f3f5;
}
.preview.sm {
  height: 240rpx;
  margin-bottom: 20rpx;
}
.ph {
  height: 300rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #969799;
  font-size: 26rpx;
  border: 2rpx dashed #dcdee0;
  border-radius: 16rpx;
  background: #f7f8fa;
}
.plus {
  font-size: 56rpx;
  margin-bottom: 8rpx;
  color: #07c160;
}
.line {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: #5c564e;
  margin-bottom: 10rpx;
}
.btns {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}
.btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.ghost {
  background: #f2f3f5;
  color: #171a1d;
}
.solid {
  background: #07c160;
  color: #ffffff;
}
.btn-hover {
  opacity: 0.85;
}
.share {
  width: 100%;
  margin-top: 16rpx;
}
</style>
