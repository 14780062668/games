<template>
  <view class="page">
    <text class="h">用户隐私保护指引</text>
    <text class="p">开发者：随身工具（AppID wx3dd141820c627a49）</text>
    <text class="p">本小程序为本地工具，数据默认只存在你的手机，不上传服务器。</text>
    <text class="h2">我们如何处理信息</text>
    <text class="p">1. 选中的照片：仅在你使用「图片压缩」「格式转换」并主动选图时，用于本地压缩或格式转换，不会上传。</text>
    <text class="p">2. 相册：仅在你点击「保存」时，把处理好的图片写入相册。</text>
    <text class="p">3. 本地存储：记账、待办保存在本机缓存，可随时删除小程序清除。</text>
    <text class="p">4. 不收集身份证、手机号、位置，不调用定位、支付、分享到朋友圈以外的能力。</text>
    <text class="h2">你的权利</text>
    <text class="p">可拒绝授权。拒绝后，选图和保存到相册不可用，其他工具仍可使用。可在微信「设置-已使用的小程序」中删除本小程序及本地数据。</text>
    <view v-if="need" class="row">
      <view class="btn ghost" @tap="no">拒绝</view>
      <button
        id="agree-btn"
        class="btn solid"
        open-type="agreePrivacyAuthorization"
        @agreeprivacyauthorization="yes"
      >
        同意
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { acceptPrivacy, denyPrivacy } from '../../utils/privacy.js'

const need = ref(false)

onLoad((q) => {
  need.value = !!(q && q.need)
})

function yes() {
  acceptPrivacy()
  uni.navigateBack()
}

function no() {
  denyPrivacy()
  uni.navigateBack()
}
</script>

<style scoped>
.page {
  padding: 32rpx 36rpx 80rpx;
}
.h {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
}
.h2 {
  display: block;
  margin-top: 32rpx;
  margin-bottom: 12rpx;
  font-size: 30rpx;
  font-weight: 700;
}
.p {
  display: block;
  font-size: 28rpx;
  line-height: 1.7;
  color: #5c564e;
  margin-bottom: 16rpx;
}
.row {
  display: flex;
  gap: 16rpx;
  margin-top: 40rpx;
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
  background: #efe8dc;
  color: #1f1b16;
}
.solid {
  background: #1f1b16;
  color: #f6efe4;
  padding: 0;
  margin: 0;
}
</style>
