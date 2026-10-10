<template>
  <view class="page">
    <view class="card">
      <text class="h">用户隐私保护指引</text>
      <text class="p">开发者：瘦图盒（AppID wx3dd141820c627a49）</text>
      <text class="p">本小程序为本地工具，数据默认只存在你的手机，不上传服务器。</text>
      <text class="h2">我们如何处理信息</text>
      <text class="p">1. 选中的照片和你输入的文字：照片用于本地压缩或格式转换，文字用于本地生成二维码；为内容安全合规，可能调用微信内容安全接口做检测。</text>
      <text class="p">2. 相册：仅在你点击「保存」时，把处理好的图片写入相册。</text>
      <text class="p">3. 本地存储：记账、待办保存在本机缓存，可随时删除小程序清除。</text>
      <text class="p">4. 不收集身份证、手机号、位置，不调用定位、支付等无关能力。</text>
      <text class="h2">你的权利</text>
      <text class="p">可拒绝授权。拒绝后，选图和保存到相册不可用，其他工具仍可使用。可在微信「设置-已使用的小程序」中删除本小程序及本地数据。</text>
    </view>
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
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { acceptPrivacy, denyPrivacy, settlePrivacyOnLeave } from '../../utils/privacy.js'

const need = ref(false)

onLoad((q) => {
  need.value = !!(q && q.need)
})

onUnload(() => {
  settlePrivacyOnLeave()
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
  padding: 24rpx 28rpx 80rpx;
}
.card {
  background: #ffffff;
  border: none;
  border-radius: 20rpx;
  padding: 36rpx 32rpx 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}
.h {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
  color: #1c1915;
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
  background: #f2f3f5;
  color: #171a1d;
}
.solid {
  background: #07c160;
  color: #ffffff;
  padding: 0;
  margin: 0;
}
</style>
