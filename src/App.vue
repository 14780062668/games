<template>
  <view />
</template>

<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { setPrivacyResolve } from './utils/privacy.js'
import { initCloud } from './utils/secCheck.js'

onLaunch(() => {
  // #ifdef MP-WEIXIN
  try {
    initCloud()
  } catch (e) {}
  if (typeof wx !== 'undefined' && wx.onNeedPrivacyAuthorization) {
    wx.onNeedPrivacyAuthorization((resolve) => {
      setPrivacyResolve(resolve)
      const o = Object.create(null)
      o.url = '/pages/privacy/privacy?need=1'
      uni.navigateTo({
        url: o.url,
        fail: () => {
          // 跳转失败时直接同意，避免卡死白屏
          try {
            resolve({ event: 'agree', buttonId: 'agree-btn' })
          } catch (e) {}
        },
      })
    })
  }
  // #endif
})

onShow(() => {})
</script>

<style>
page {
  height: 100%;
  background: #f3efe8;
  color: #1f1b16;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
}

/* #ifdef H5 */
html,
body {
  background: #f3efe8;
}
uni-page-body {
  max-width: 430px;
  margin: 0 auto;
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
