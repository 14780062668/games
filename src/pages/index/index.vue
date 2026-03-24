<template>
  <view class="wrap">
    <view class="title">选择游戏</view>
    <view class="card" @click="go('/pages/sudoku/sudoku')">
      <text class="name">数独</text>
      <text class="hint">9×9 经典数独</text>
    </view>
    <view class="card" @click="go('/pages/gomoku/gomoku')">
      <text class="name">五子棋</text>
      <text class="hint">双人对弈 15×15</text>
    </view>
    <view class="card" @click="go('/pages/jinhua/jinhua')">
      <text class="name">打金花</text>
      <text class="hint">三张牌比大小</text>
    </view>
    <view class="card" @click="go('/pages/ssq/ssq')">
      <text class="name">双色球</text>
      <text class="hint">随机生成投注号码</text>
    </view>
    <view class="card" @click="go('/pages/dice/dice')">
      <text class="name">摇色子</text>
      <text class="hint">点击摇一摇，3秒出结果</text>
    </view>
  </view>
</template>

<script setup>
function go(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.wrap {
  padding: 48rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 40rpx;
  color: #222;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 36rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}
.name {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}
.hint {
  font-size: 26rpx;
  color: #888;
}
</style>
