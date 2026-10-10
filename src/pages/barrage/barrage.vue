<template>
  <!-- 自定义导航：页面无原生导航栏，弹幕层才能盖住整个屏幕 -->
  <view class="page" :style="{ paddingTop: statusBarH + 'px' }">
    <view class="nav">
      <view class="back" hover-class="back-hover" @tap="back">‹</view>
      <text class="nav-t">手持弹幕</text>
    </view>
    <view class="box">
      <input
        class="inp"
        :value="text"
        placeholder="输入弹幕文字"
        maxlength="40"
        confirm-type="done"
        @input="onText"
        @confirm="start"
      />
    </view>
    <view class="row">
      <text class="lab">颜色</text>
      <view class="swatches">
        <view
          v-for="c in colors"
          :key="c"
          class="sw"
          :class="{ on: color === c }"
          :style="{ background: c }"
          @tap="color = c"
        />
      </view>
    </view>
    <view class="row">
      <text class="lab">字号</text>
      <slider class="sl" :value="size" min="40" max="160" activeColor="#07c160" @change="onSize" />
    </view>
    <view class="row">
      <text class="lab">速度</text>
      <slider class="sl" :value="speed" min="1" max="10" activeColor="#07c160" @change="onSpeed" />
    </view>
    <view class="go" hover-class="go-hover" @tap="start">开始滚动</view>

    <!-- 全屏弹幕层，点击退出 -->
    <view v-if="playing" class="mask" @tap="stop">
      <view class="track" :style="trackStyle">
        <text class="msg" :style="{ color: color, fontSize: size + 'rpx' }">{{ text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onUnload } from '@dcloudio/uni-app'
import { ensureSafeMsg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 手持弹幕', '/pages/barrage/barrage')

const colors = ['#ffffff', '#07c160', '#ffd666', '#ff6b6b', '#4b7bec', '#a55eea']
const text = ref('瘦图盒真好用')
const color = ref('#ffffff')
const size = ref(80)
const speed = ref(5)
const playing = ref(false)
// 自定义导航要自己留出状态栏高度
const statusBarH = ref(0)
try {
  statusBarH.value = uni.getSystemInfoSync().statusBarHeight || 0
} catch (e) {}

function back() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
}

// 滚动时长：速度越快时长越短
const trackStyle = computed(() => {
  const dur = (12 - speed.value) * 1.2
  return { animationDuration: dur + 's' }
})

function onText(e) {
  text.value = String(e.detail.value || '').slice(0, 40)
}

function onSize(e) {
  size.value = e.detail.value
}

function onSpeed(e) {
  speed.value = e.detail.value
}

async function start() {
  const t = text.value.trim()
  if (!t) {
    uni.showToast({ title: '先写点内容', icon: 'none' })
    return
  }
  if (!(await ensureSafeMsg(t))) return
  playing.value = true
  // #ifdef MP-WEIXIN
  uni.setKeepScreenOn({ keepScreenOn: true })
  // #endif
}

function stop() {
  playing.value = false
  // #ifdef MP-WEIXIN
  uni.setKeepScreenOn({ keepScreenOn: false })
  // #endif
}

// 播放中直接返回/退到后台时，必须恢复屏幕常亮设置
onHide(() => {
  if (playing.value) stop()
})
onUnload(stop)
</script>

<style scoped>
.page {
  padding: 0 28rpx 80rpx;
}
.nav {
  display: flex;
  align-items: center;
  height: 88rpx;
  margin-bottom: 24rpx;
}
.back {
  width: 56rpx;
  height: 56rpx;
  line-height: 48rpx;
  text-align: center;
  font-size: 52rpx;
  color: #171a1d;
  border-radius: 50%;
  margin-left: -12rpx;
}
.back-hover {
  background: #ecedef;
}
.nav-t {
  margin-left: 8rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #171a1d;
}
.box {
  margin-bottom: 24rpx;
}
.inp {
  height: 88rpx;
  background: #ffffff;
  border: none;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.row {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.lab {
  width: 90rpx;
  font-size: 26rpx;
  color: #646566;
  flex-shrink: 0;
}
.swatches {
  display: flex;
  gap: 18rpx;
}
.sw {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  /* 白色色块在白卡片上看不见，统一给浅灰描边 */
  border: 4rpx solid #dcdee0;
}
.sw.on {
  border-color: #171a1d;
}
.sl {
  flex: 1;
}
.go {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  margin-top: 24rpx;
  background: linear-gradient(135deg, #0bc36a, #059e54);
  box-shadow: 0 6rpx 16rpx rgba(7, 193, 96, 0.25);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.go-hover {
  opacity: 0.85;
}
.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: #000000;
  z-index: 999;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.track {
  white-space: nowrap;
  animation-name: roll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}
.msg {
  font-weight: 700;
  white-space: nowrap;
}
/* 从屏幕右侧滚到左侧 */
@keyframes roll {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-100%);
  }
}
</style>
