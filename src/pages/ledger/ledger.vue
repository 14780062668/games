<template>
  <view class="page">
    <view class="sum">
      <view class="cell">
        <text class="lab">本月收入</text>
        <text class="val in">{{ inStr }}</text>
      </view>
      <view class="cell">
        <text class="lab">本月支出</text>
        <text class="val out">{{ outStr }}</text>
      </view>
      <view class="cell wide">
        <text class="lab">结余</text>
        <text class="val" :class="balCls">{{ balStr }}</text>
      </view>
    </view>

    <view class="card">
      <view class="tabs">
        <view class="tab" :class="{ on: form.type === 'out' }" @tap="setType('out')">支出</view>
        <view class="tab" :class="{ on: form.type === 'in' }" @tap="setType('in')">收入</view>
      </view>
      <view class="cates">
        <view
          v-for="c in cates"
          :key="c"
          class="chip"
          :class="{ on: form.cate === c }"
          @tap="setCate(c)"
        >
          {{ c }}
        </view>
      </view>
      <view class="row">
        <input
          class="inp"
          type="digit"
          :value="form.amount"
          placeholder="金额"
          maxlength="10"
          @input="onAmount"
        />
        <picker mode="date" :value="form.date" :end="today" @change="onDate">
          <view class="date">{{ form.date }}</view>
        </picker>
      </view>
      <input
        class="note"
        :value="form.note"
        placeholder="备注（可选）"
        maxlength="30"
        @input="onNote"
      />
      <view class="add" hover-class="add-hover" @tap="add">记一笔</view>
    </view>

    <view v-if="!grouped.length" class="empty">还没有记录</view>
    <view v-for="g in grouped" :key="g.date" class="group">
      <view class="ghead">
        <text>{{ g.date }}</text>
        <text class="gsub">{{ g.tip }}</text>
      </view>
      <view v-for="it in g.items" :key="it.id" class="item">
        <view class="left">
          <text class="cate">{{ it.cate }}</text>
          <text class="desc">{{ it.note || (it.type === 'in' ? '收入' : '支出') }}</text>
        </view>
        <view class="right">
          <text class="amt" :class="it.type">{{ it.type === 'in' ? '+' : '-' }}{{ money(it.amount) }}</text>
          <text class="del" @tap="remove(it.id)">删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { load, save, uid } from '../../utils/store.js'
import { pad2 } from '../../utils/fmt.js'
import { ensureSafeMsg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 记账', '/pages/ledger/ledger')

const KEY = 'tools_ledger_v1'
const OUT = ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '其他']
const IN = ['工资', '兼职', '红包', '理财', '其他']

const list = ref([])

function todayStr() {
  const t = new Date()
  return t.getFullYear() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate())
}

const today = ref(todayStr())
const form = reactive({
  type: 'out',
  cate: '餐饮',
  amount: '',
  note: '',
  date: today.value,
})

const cates = computed(() => (form.type === 'in' ? IN : OUT))

const inStr = computed(() => money(sumMonth('in')))
const outStr = computed(() => money(sumMonth('out')))
const balStr = computed(() => money(sumMonth('in') - sumMonth('out')))
const balCls = computed(() => (sumMonth('in') - sumMonth('out') >= 0 ? 'in' : 'out'))

const grouped = computed(() => {
  const map = {}
  for (const it of list.value) {
    if (!map[it.date]) map[it.date] = []
    map[it.date].push(it)
  }
  const dates = Object.keys(map).sort((a, b) => (a < b ? 1 : -1))
  return dates.map((date) => {
    const items = map[date]
    let inn = 0
    let out = 0
    for (const it of items) {
      if (it.type === 'in') inn += it.amount
      else out += it.amount
    }
    const tip = (inn ? '收 ' + money(inn) + '  ' : '') + (out ? '支 ' + money(out) : '')
    return { date, items, tip: tip.trim() }
  })
})

function money(n) {
  const x = Math.round((Number(n) || 0) * 100) / 100
  return x.toFixed(2)
}

function sumMonth(type) {
  const prefix = today.value.slice(0, 7)
  let s = 0
  for (const it of list.value) {
    if (it.type === type && String(it.date).slice(0, 7) === prefix) s += it.amount
  }
  return s
}

function reload() {
  const raw = load(KEY, [])
  list.value = Array.isArray(raw)
    ? raw.filter((x) => x && x.id && Number(x.amount) > 0)
    : []
}

onShow(() => {
  today.value = todayStr()
  if (form.date > today.value) form.date = today.value
  reload()
})

function onAmount(e) {
  const raw = String(e.detail.value || '')
  let v = raw.replace(/[^\d.]/g, '')
  const i = v.indexOf('.')
  if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2)
  if (v.length > 1 && v[0] === '0' && v[1] !== '.') v = String(Number(v))
  if (raw !== v) {
    form.amount = raw
    nextTick(() => {
      form.amount = v
    })
    return
  }
  form.amount = v
}

function onNote(e) {
  form.note = String(e.detail.value || '').slice(0, 30)
}

function setType(t) {
  form.type = t === 'in' ? 'in' : 'out'
  const next = t === 'in' ? IN : OUT
  if (!next.includes(form.cate)) form.cate = next[0]
}

function setCate(c) {
  if (cates.value.includes(c)) form.cate = c
}

function onDate(e) {
  const v = e.detail.value
  if (v && v <= today.value) form.date = v
}

async function add() {
  const amt = Math.round(Number(form.amount) * 100) / 100
  if (!Number.isFinite(amt) || amt <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  if (amt > 99999999) {
    uni.showToast({ title: '金额过大', icon: 'none' })
    return
  }
  const note = form.note.trim()
  if (note && !(await ensureSafeMsg(note))) return
  const cate = cates.value.includes(form.cate) ? form.cate : cates.value[0]
  const date = form.date && form.date <= today.value ? form.date : today.value
  const item = {
    id: uid(),
    type: form.type === 'in' ? 'in' : 'out',
    amount: amt,
    cate,
    note,
    date,
  }
  list.value.unshift(item)
  if (!save(KEY, list.value)) {
    list.value.shift()
    return
  }
  form.amount = ''
  form.note = ''
  uni.showToast({ title: '已记下', icon: 'none' })
}

function remove(id) {
  uni.showModal({
    title: '删除这笔记录？',
    success: (r) => {
      if (!r.confirm) return
      const prev = list.value
      list.value = list.value.filter((x) => x.id !== id)
      if (!save(KEY, list.value)) list.value = prev
    },
  })
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.sum {
  display: flex;
  background: #171a1d;
  border-radius: 20rpx;
  padding: 28rpx 8rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.cell {
  width: 33.33%;
  padding: 0 16rpx;
  border-right: 1rpx solid rgba(255, 255, 255, 0.1);
}
.cell:last-child {
  border-right: none;
}
.wide {
  width: 33.33%;
}
.lab {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
}
.val {
  display: block;
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #ffffff;
  word-break: break-all;
}
.sum .in {
  color: #6ee7b7;
}
.sum .out {
  color: #fca5a5;
}
.in {
  color: #07c160;
}
.out {
  color: #ee0a24;
}
.card {
  background: #ffffff;
  border: none;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}
.tabs {
  display: flex;
  background: #f2f3f5;
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 20rpx;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #646566;
}
.tab.on {
  background: #ffffff;
  color: #171a1d;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.cates {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.chip {
  padding: 10rpx 22rpx;
  background: #f2f3f5;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #646566;
  margin: 0 12rpx 12rpx 0;
}
.chip.on {
  background: #171a1d;
  color: #ffffff;
}
.row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.inp,
.date,
.note {
  background: #f6f7f9;
  border-radius: 12rpx;
  height: 80rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}
.inp {
  flex: 1;
}
.date {
  width: 230rpx;
  display: flex;
  align-items: center;
  color: #1f1b16;
}
.note {
  width: 100%;
  margin-bottom: 20rpx;
}
.add {
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: linear-gradient(135deg, #0bc36a, #059e54);
  box-shadow: 0 6rpx 16rpx rgba(7, 193, 96, 0.25);
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.add-hover {
  opacity: 0.85;
}
.empty {
  text-align: center;
  color: #8a8176;
  padding: 60rpx 0;
  font-size: 26rpx;
}
.group {
  margin-bottom: 24rpx;
}
.ghead {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #8a8176;
  padding: 0 8rpx 12rpx;
}
.gsub {
  font-size: 22rpx;
}
.item {
  background: #ffffff;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.cate {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8a8176;
}
.right {
  text-align: right;
}
.amt {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
}
.amt.in {
  color: #07c160;
}
.amt.out {
  color: #ee0a24;
}
.del {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #b0a89e;
}
</style>
