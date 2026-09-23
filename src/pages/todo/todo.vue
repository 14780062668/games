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
  save(KEY, list.value)
}

function onDraft(e) {
  draft.value = String(e.detail.value || '').slice(0, 80)
}

function setFilter(id) {
  filter.value = id
}

function add() {
  const text = draft.value.trim()
  if (!text) {
    uni.showToast({ title: '先写点内容', icon: 'none' })
    return
  }
  list.value.unshift({ id: uid(), text, done: false })
  draft.value = ''
  persist()
}

function toggle(id) {
  const it = list.value.find((x) => x.id === id)
  if (!it) return
  it.done = !it.done
  persist()
}

function remove(id) {
  uni.showModal({
    title: '删除这条待办？',
    success: (r) => {
      if (!r.confirm) return
      list.value = list.value.filter((x) => x.id !== id)
      persist()
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
  height: 84rpx;
  background: #fffcf8;
  border-radius: 20rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}
.go {
  width: 128rpx;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  background: #3d6ea8;
  color: #fff;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.go-hover {
  opacity: 0.85;
}
.filters {
  display: flex;
  margin-bottom: 20rpx;
}
.f {
  margin-right: 28rpx;
  font-size: 26rpx;
  color: #8a8278;
}
.f.on {
  color: #1f1b16;
  font-weight: 700;
}
.empty {
  text-align: center;
  color: #8a8278;
  padding: 80rpx 0;
  font-size: 26rpx;
}
.item {
  background: #fffcf8;
  border-radius: 22rpx;
  padding: 24rpx;
  margin-bottom: 14rpx;
  display: flex;
  align-items: center;
}
.check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  border: 3rpx solid #cfc6b8;
  margin-right: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
  flex-shrink: 0;
}
.item.done .check {
  background: #0f7a6c;
  border-color: #0f7a6c;
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
