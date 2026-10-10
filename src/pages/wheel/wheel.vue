<template>
  <view class="page">
    <view class="wheel-card">
      <!-- 指针和 GO 放在裁剪层外面，wheel-wrap 的圆角裁剪会切掉超出部分 -->
      <view class="wheel-box">
        <view class="wheel-wrap">
          <!-- width/height 供 H5 设置画布缓冲，小程序下由样式决定 -->
          <canvas canvas-id="wheel" class="wheel" width="300" height="300" />
        </view>
        <view class="pin" />
        <view class="hub" hover-class="hub-hover" @tap="spin">
          {{ spinning ? '…' : 'GO' }}
        </view>
      </view>
      <text class="whint">点中间 GO 开始</text>
    </view>
    <view class="box">
      <input
        class="inp"
        :value="draft"
        placeholder="自定义选项，如：吃麻辣烫"
        maxlength="12"
        confirm-type="done"
        @input="onDraft"
        @confirm="add"
      />
      <view class="go" hover-class="go-hover" @tap="add">添加</view>
    </view>
    <view v-if="sugs.length" class="sugs">
      <text class="sugs-lab">快捷添加</text>
      <view
        v-for="s in sugs"
        :key="s"
        class="sug"
        hover-class="sug-hover"
        @tap="addSug(s)"
      >
        + {{ s }}
      </view>
    </view>
    <view class="sec">选项（{{ options.length }}/12）</view>
    <view class="opts">
      <view v-for="(o, i) in options" :key="i" class="opt">
        <view class="dotc" :style="{ background: colors[i % colors.length] }" />
        <text class="otxt">{{ o }}</text>
        <text class="odel" @tap="del(i)">×</text>
      </view>
    </view>
    <view v-if="options.length < 2" class="tip">至少 2 个选项才能转</view>
  </view>
</template>

<script setup>
import { computed, ref, getCurrentInstance, onMounted } from 'vue'
import { load, save } from '../../utils/store.js'
import { ensureSafeMsg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 随机转盘', '/pages/wheel/wheel')

const KEY = 'tools_wheel_v1'
const colors = ['#ff6b6b', '#f7b731', '#20bf6b', '#4b7bec', '#a55eea', '#fa8231', '#0fb9b1', '#eb3b5a']

const inst = getCurrentInstance()
// 与 format/qr 页保持一致，传组件公共实例
const proxy = inst && inst.proxy
const DEFAULT_OPTIONS = ['吃火锅', '吃烧烤', '吃日料', '自己做饭', '点外卖', '吃面条']
const SUGGESTIONS = ['吃麻辣烫', '吃轻食', '喝奶茶', '看电影', '去运动', '宅家里']
// 存储损坏时回退默认选项；用户删空得到的 [] 要尊重
const rawOpts = load(KEY, null)
const options = ref(Array.isArray(rawOpts) ? rawOpts : DEFAULT_OPTIONS)
const draft = ref('')
const spinning = ref(false)
// 当前旋转角度（度），0 度方向为指针（正上方）
let angle = 0
let ctx = null

onMounted(() => {
  ctx = uni.createCanvasContext('wheel', proxy)
  draw()
})

function persist() {
  return save(KEY, options.value)
}

// 画转盘：每个选项一个扇区，0 度从正上方开始顺时针
function draw() {
  if (!ctx) return
  const n = options.value.length
  const size = 300
  const c = size / 2
  const r = c - 4
  ctx.clearRect(0, 0, size, size)
  if (!n) {
    ctx.draw()
    return
  }
  const arc = (Math.PI * 2) / n
  for (let i = 0; i < n; i++) {
    const start = -Math.PI / 2 + (angle * Math.PI) / 180 + i * arc
    ctx.beginPath()
    ctx.moveTo(c, c)
    ctx.arc(c, c, r, start, start + arc)
    ctx.closePath()
    ctx.setFillStyle(colors[i % colors.length])
    ctx.fill()
    // 扇区分隔白线，层次更清晰
    ctx.setStrokeStyle('#ffffff')
    ctx.setLineWidth(2)
    ctx.stroke()
    // 文字沿半径方向放置
    ctx.save()
    ctx.translate(c, c)
    ctx.rotate(start + arc / 2)
    ctx.setFillStyle('#ffffff')
    ctx.setFontSize(14)
    ctx.setTextAlign('right')
    ctx.fillText(String(options.value[i]).slice(0, 6), r - 14, 5)
    ctx.restore()
  }
  ctx.draw()
}

// 转动：多圈 + 随机落点，缓动减速，setTimeout 保证小程序/H5 都可用
function spin() {
  if (spinning.value) return
  if (options.value.length < 2) {
    uni.showToast({ title: '至少 2 个选项', icon: 'none' })
    return
  }
  spinning.value = true
  const start = angle
  const target = start + 360 * 6 + Math.random() * 360
  const dur = 4000
  const t0 = Date.now()
  const step = () => {
    const p = Math.min(1, (Date.now() - t0) / dur)
    const e = 1 - Math.pow(1 - p, 3)
    angle = start + (target - start) * e
    draw()
    if (p < 1) {
      setTimeout(step, 16)
    } else {
      angle = angle % 360
      spinning.value = false
      const n = options.value.length
      // 指针固定在正上方，反推落在哪个扇区
      const at = ((360 - (angle % 360)) % 360) / 360
      const idx = Math.floor(at * n) % n
      uni.showModal({
        title: '结果',
        content: options.value[idx],
        showCancel: false,
      })
    }
  }
  step()
}

function onDraft(e) {
  draft.value = String(e.detail.value || '').slice(0, 12)
}

// 已在列表里的不推荐
const sugs = computed(() => SUGGESTIONS.filter((s) => !options.value.includes(s)))

// 统一入口：加选项并持久化、重绘
function addOption(text) {
  // 转动中禁止改动选项，否则落点索引会错位
  if (spinning.value) return false
  if (options.value.length >= 12) {
    uni.showToast({ title: '最多 12 个选项', icon: 'none' })
    return false
  }
  if (options.value.includes(text)) {
    uni.showToast({ title: '选项已存在', icon: 'none' })
    return false
  }
  options.value.push(text)
  if (!persist()) {
    options.value.pop()
    return false
  }
  draw()
  return true
}

async function add() {
  const text = draft.value.trim()
  if (!text) return
  if (!(await ensureSafeMsg(text))) return
  if (addOption(text)) draft.value = ''
}

function addSug(s) {
  addOption(s)
}

function del(i) {
  if (spinning.value) return
  // 与其他页面一致：持久化失败要回滚
  const removed = options.value.splice(i, 1)[0]
  if (!persist()) {
    options.value.splice(i, 0, removed)
    return
  }
  draw()
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.wheel-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 40rpx 24rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(23, 26, 29, 0.06);
}
/* 定位容器：不裁剪，指针可以超出转盘顶部 */
.wheel-box {
  position: relative;
  width: 314px;
  height: 314px;
  margin: 0 auto;
}
.wheel-wrap {
  position: relative;
  /* 画布绘制坐标固定 300px，这里用 px 不用 rpx：小程序画布缓冲=布局像素，
     用 rpx 会随屏宽变化导致绘制错位。314 = 画布 300 + 两侧轮圈 14 */
  width: 314px;
  height: 314px;
  border-radius: 50%;
  /* 白色轮圈 + 外阴影，像真实转盘 */
  border: 7px solid #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(23, 26, 29, 0.14);
  overflow: hidden;
}
.wheel {
  width: 100%;
  height: 100%;
}
/* 水滴图钉指针：SVG 一体成形，红色白描边 */
.pin {
  position: absolute;
  top: -20rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 56rpx;
  height: 77rpx;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA2NiI+PHBhdGggZD0iTTI0IDNDMzQuNSAzIDQzIDExLjUgNDMgMjJjMCAxNC0xOSA0MS0xOSA0MVM1IDM2IDUgMjJDNSAxMS41IDEzLjUgMyAyNCAzeiIgZmlsbD0iI2U2NDU0NSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjUiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjIyIiByPSI3LjUiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  filter: drop-shadow(0 3rpx 5rpx rgba(0, 0, 0, 0.3));
  z-index: 2;
}
/* 中心 GO 按钮，盖住轮毂位置 */
.hub {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 130rpx;
  height: 130rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #0bc36a, #059e54);
  box-shadow: 0 6rpx 20rpx rgba(7, 193, 96, 0.4), inset 0 2rpx 6rpx rgba(255, 255, 255, 0.35);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  z-index: 1;
}
.hub-hover {
  opacity: 0.88;
}
.whint {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: #969799;
}
.sec {
  font-size: 26rpx;
  font-weight: 600;
  color: #646566;
  margin: 8rpx 4rpx 16rpx;
}
.sugs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 24rpx;
}
.sugs-lab {
  font-size: 24rpx;
  color: #969799;
}
.sug {
  padding: 10rpx 22rpx;
  background: #ffffff;
  border: 1rpx dashed #c8c9cc;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #059e54;
}
.sug-hover {
  background: #f0f9f4;
}
.box {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
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
  box-shadow: 0 6rpx 16rpx rgba(7, 193, 96, 0.25);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.go-hover {
  opacity: 0.85;
}
.opts {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.opt {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 999rpx;
  padding: 12rpx 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.dotc {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}
.otxt {
  font-size: 26rpx;
  color: #171a1d;
}
.odel {
  margin-left: 12rpx;
  font-size: 30rpx;
  color: #b0a89e;
  line-height: 1;
}
.tip {
  text-align: center;
  color: #8a8176;
  font-size: 24rpx;
  margin-top: 30rpx;
}
</style>
