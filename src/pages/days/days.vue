<template>
  <view class="page">
    <view class="box">
      <input
        class="inp"
        :value="name"
        placeholder="事件，如：春节、考试"
        maxlength="20"
        confirm-type="done"
        @input="onName"
      />
      <picker mode="date" :value="date" @change="onDate">
        <view class="pick">{{ date || '选日期' }}</view>
      </picker>
      <view class="go" hover-class="go-hover" @tap="add">添加</view>
    </view>
    <view v-if="!list.length" class="empty">还没有倒数日</view>
    <view v-for="it in list" :key="it.id" class="item">
      <view class="info">
        <text class="name">{{ it.name }}</text>
        <text class="date">{{ it.date }}</text>
      </view>
      <view class="cnt" :class="{ past: diffOf(it) < 0 }">
        <text class="num">{{ Math.abs(diffOf(it)) }}</text>
        <text class="lab">{{ labelOf(it) }}</text>
      </view>
      <text class="del" @tap="remove(it.id)">删除</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { load, save, uid } from '../../utils/store.js'
import { ensureSafeMsg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 倒数日', '/pages/days/days')

const KEY = 'tools_days_v1'
const list = ref([])
const name = ref('')
const date = ref('')

// 今天 0 点的时间戳，用于整天比较
function today() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// 与目标日期相差的天数：正数=未来，负数=已过
function diffOf(it) {
  const t = new Date(it.date.replace(/-/g, '/')).getTime()
  return Math.round((t - today()) / 86400000)
}

function labelOf(it) {
  const d = diffOf(it)
  if (d === 0) return '就是今天'
  return d > 0 ? '天后' : '天前'
}

function reload() {
  const raw = load(KEY, [])
  list.value = Array.isArray(raw)
    ? raw.filter((x) => x && x.id && x.date)
    : []
}

onShow(reload)

function persist() {
  return save(KEY, list.value)
}

function onName(e) {
  name.value = String(e.detail.value || '').slice(0, 20)
}

function onDate(e) {
  date.value = e.detail.value
}

async function add() {
  const text = name.value.trim()
  if (!text) {
    uni.showToast({ title: '先写事件名', icon: 'none' })
    return
  }
  if (!date.value) {
    uni.showToast({ title: '先选日期', icon: 'none' })
    return
  }
  if (!(await ensureSafeMsg(text))) return
  const item = { id: uid(), name: text, date: date.value }
  list.value.unshift(item)
  if (!persist()) {
    list.value.shift()
    return
  }
  name.value = ''
}

function remove(id) {
  uni.showModal({
    title: '删除这个倒数日？',
    success: (r) => {
      if (!r.confirm) return
      const prev = list.value
      list.value = list.value.filter((x) => x.id !== id)
      if (!persist()) list.value = prev
    },
  })
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.box {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}
.inp {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  background: #ffffff;
  border: none;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.pick {
  width: 170rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #ffffff;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #646566;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.go {
  width: 120rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #0bc36a, #059e54);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.go-hover {
  opacity: 0.85;
}
.empty {
  text-align: center;
  color: #8a8176;
  padding: 80rpx 0;
  font-size: 26rpx;
}
.item {
  background: #ffffff;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 14rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #171a1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.date {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #969799;
}
.cnt {
  display: flex;
  align-items: baseline;
  margin: 0 18rpx;
  flex-shrink: 0;
}
.num {
  font-size: 44rpx;
  font-weight: 700;
  color: #07c160;
}
.cnt.past .num {
  color: #969799;
}
.lab {
  margin-left: 6rpx;
  font-size: 22rpx;
  color: #969799;
}
.del {
  font-size: 22rpx;
  color: #b0a89e;
  flex-shrink: 0;
}
</style>
