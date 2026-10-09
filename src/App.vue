<template>
  <view />
</template>

<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { initCloud } from './utils/secCheck.js'

onLaunch(() => {
  // #ifdef MP-WEIXIN
  try {
    initCloud()
  } catch (e) {}
  // 不在这里跳隐私页。跳转完不回调的话，微信会用蒙层把页面盖成白屏。
  // 选图前走 requirePrivacyAuthorize，由官方弹窗完成同意。
  // #endif
})

onShow(() => {})
</script>

<style>
page {
  height: 100%;
  background: #ebe4d8;
  color: #1c1915;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
}

view,
text,
input,
textarea,
button,
image {
  box-sizing: border-box;
}

/* #ifdef H5 */
html,
body {
  background: #d8d0c4;
}
uni-page-body {
  max-width: 430px;
  min-height: 100%;
  margin: 0 auto;
  background: #ebe4d8;
  box-shadow: 0 0 48px rgba(60, 40, 16, 0.12);
}
/* #endif */

button {
  margin: 0;
  padding: 0;
  background: none;
  font-size: inherit;
  line-height: inherit;
}

button::after {
  border: none;
}
</style>
