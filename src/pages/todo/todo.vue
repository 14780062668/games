<template>
  <view class="page">
    <view class="box">
      <input
        class="inp"
        :value="draft"
        placeholder="写下一件要做的事"
        maxlength="80"
        confirm-type="done"
        @input="onDraft"
        @confirm="add"
      />
      <view class="go" hover-class="go-hover" @tap="add">添加</view>
    </view>
    <view class="filters">
      <text
        v-for="f in filters"
        :key="f.id"
        class="f"
        :class="{ on: filter === f.id }"
        @tap="setFilter(f.id)"
      >
        {{ f.name }}
      </text>
    </view>
    <view v-if="!shown.length" class="empty">{{ emptyText }}</view>
    <view v-for="it in shown" :key="it.id" class="item" :class="{ done: it.done }">
      <view class="check" @tap="toggle(it.id)">
        <text v-if="it.done">✓</text>
      </view>
      <text class="txt" @tap="toggle(it.id)">{{ it.text }}</text>
      <text class="del" @tap="remove(it.id)">删除</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { load, save, uid } from '../../utils/store.js'
import { ensureSafeMsg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 待办', '/pages/todo/todo')

const KEY = 'tools_todo_v1'
const list = ref([])
const draft = ref('')
const filter = ref('all')
const filters = [
  { id: 'all', name: '全部' },
  { id: 'open', name: '未完成' },
  { id: 'done', name: '已完成' },
]

const shown = computed(() => {
  if (filter.value === 'open') return list.value.filter((x) => !x.done)
  if (filter.value === 'done') return list.value.filter((x) => x.done)
  return list.value
})

const emptyText = computed(() => {
  if (!list.value.length) return '还没有待办'
  if (filter.value === 'open') return '都做完了'
  if (filter.value === 'done') return '还没有完成项'
  return '还没有待办'
})

function reload() {
  const raw = load(KEY, [])
  list.value = Array.isArray(raw)
    ? raw.filter((x) => x && x.id && String(x.text || '').trim())
    : []
}

onShow(reload)

function persist() {
  return save(KEY, list.value)
}

function onDraft(e) {
  draft.value = String(e.detail.value || '').slice(0, 80)
}

function setFilter(id) {
  filter.value = id
}

async function add() {
  const text = draft.value.trim()
  if (!text) {
    uni.showToast({ title: '先写点内容', icon: 'none' })
    return
  }
  if (!(await ensureSafeMsg(text))) return
  const item = { id: uid(), text, done: false }
  list.value.unshift(item)
  if (!persist()) {
    list.value.shift()
    return
  }
  draft.value = ''
}

function toggle(id) {
  const it = list.value.find((x) => x.id === id)
  if (!it) return
  it.done = !it.done
  if (!persist()) it.done = !it.done
}

function remove(id) {
  uni.showModal({
    title: '删除这条待办？',
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
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.inp {
  flex: 1;
  height: 88rpx;
  background: #ffffff;
  border: none;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.go {
  width: 132rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #0bc36a, #059e54);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.go-hover {
  opacity: 0.85;
}
.filters {
  display: flex;
  background: #f2f3f5;
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 22rpx;
}
.f {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #646566;
}
.f.on {
  background: #ffffff;
  color: #171a1d;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
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
.check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  border: 2rpx solid #dcdee0;
  margin-right: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #ffffff;
  flex-shrink: 0;
}
.item.done .check {
  background: #07c160;
  border-color: #07c160;
}
.txt {
  flex: 1;
  font-size: 30rpx;
  color: #1f1b16;
  word-break: break-all;
}
.item.done .txt {
  color: #b0a89e;
  text-decoration: line-through;
}
.del {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #b0a89e;
  flex-shrink: 0;
}
</style>
