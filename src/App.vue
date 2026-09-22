<template>
  <view />
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
onShow(() => {
  uni.hideLoading()
})
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
