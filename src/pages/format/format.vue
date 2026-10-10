<template>
  <view class="page">
    <view class="tabs">
      <text v-for="t in tabs" :key="t.id" class="tab" :class="{ on: tab === t.id }" @tap="setTab(t.id)">
        {{ t.name }}
      </text>
    </view>

    <view v-if="tab === 'img'" class="card">
      <view class="pick" @tap="chooseImg">
        <image v-if="imgSrc" class="preview" :src="imgSrc" mode="aspectFit" />
        <text v-else class="ph">选择图片，转为 JPG 或 PNG</text>
      </view>
      <view class="btns">
        <view class="btn ghost" @tap="toImg('image/jpeg')">转 JPG</view>
        <view class="btn solid" @tap="toImg('image/png')">转 PNG</view>
      </view>
      <view v-if="imgOut" class="outbox">
        <image class="preview sm" :src="imgOut" mode="aspectFit" />
        <text class="meta">{{ imgOutHint }}</text>
        <view class="btn solid" @tap="saveImg">保存</view>
      </view>
    </view>

    <view v-if="tab === 'time'" class="card">
      <text class="lab">时间戳（秒或毫秒）</text>
      <input class="inp" type="number" :value="ts" placeholder="例如 1730000000" @input="onTs" />
      <view class="btn solid slim" @tap="ts2date">转为日期</view>
      <text v-if="tsOut" class="result">{{ tsOut }}</text>
      <view class="div" />
      <text class="lab">日期时间</text>
      <view class="row">
        <picker class="grow" mode="date" :value="dateVal" @change="onDate">
          <view class="pickbox">{{ dateVal }}</view>
        </picker>
        <picker class="grow" mode="time" :value="timeVal" @change="onTime">
          <view class="pickbox">{{ timeVal }}</view>
        </picker>
      </view>
      <view class="btn ghost slim" @tap="date2ts">转为时间戳</view>
      <text v-if="dateOut" class="result">{{ dateOut }}</text>
    </view>

    <view v-if="tab === 'color'" class="card">
      <text class="lab">HEX 或 RGB</text>
      <input class="inp" :value="colorIn" placeholder="#0f7a6c 或 15,122,108" @input="onColor" />
      <view class="swatch" :style="{ background: colorCss || '#efe8dc' }" />
      <text v-if="colorOut" class="result">{{ colorOut }}</text>
      <text v-else-if="colorBad" class="err">颜色格式不正确</text>
    </view>

    <view v-if="tab === 'json'" class="card">
      <textarea class="area" :value="jsonIn" placeholder="粘贴 JSON" maxlength="8000" @input="onJson" />
      <view class="btns">
        <view class="btn ghost" @tap="jsonFmt(true)">美化</view>
        <view class="btn solid" @tap="jsonFmt(false)">压缩</view>
      </view>
      <text v-if="jsonErr" class="err">{{ jsonErr }}</text>
    </view>

    <canvas type="2d" id="fmtCanvas" class="offscreen" />
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import { onHide, onLoad } from '@dcloudio/uni-app'
import { pad2 } from '../../utils/fmt.js'
import { pickImage, convertImage, saveOrDownload, fmtSize } from '../../utils/image.js'
import { ensureSafeImg } from '../../utils/secCheck.js'
import { useShare } from '../../utils/share.js'

useShare('瘦图盒 · 时间戳转换', '/pages/format/format?tab=time')

const tabs = [
  { id: 'img', name: '图片' },
  { id: 'time', name: '时间' },
  { id: 'color', name: '颜色' },
  { id: 'json', name: 'JSON' },
]
const tab = ref('time')

onLoad((q) => {
  const t = q && q.tab
  if (t === 'img' || t === 'time' || t === 'color' || t === 'json') tab.value = t
})

function setTab(id) {
  tab.value = id
}

const imgSrc = ref('')
const imgOut = ref('')
const imgOutSize = ref(0)
const imgMime = ref('image/jpeg')
const imgBusy = ref(false)
const inst = getCurrentInstance()
const proxy = inst && inst.proxy
const imgOutHint = computed(() => {
  if (!imgOut.value) return ''
  const name = imgMime.value === 'image/png' ? 'PNG' : 'JPG'
  return name + ' · ' + fmtSize(imgOutSize.value)
})

async function chooseImg() {
  try {
    const path = await pickImage()
    imgSrc.value = path
    imgOut.value = ''
    const ok = await ensureSafeImg(path)
    if (!ok) {
      imgSrc.value = ''
    }
  } catch (e) {
    if (e && e.message === 'cancel') return
    uni.showToast({ title: (e && e.message) || '选择失败', icon: 'none' })
  }
}

async function toImg(mime) {
  if (!imgSrc.value || imgBusy.value) return
  imgBusy.value = true
  uni.showLoading({ title: '转换中', mask: true })
  try {
    const r = await convertImage(imgSrc.value, mime, proxy)
    imgOut.value = r.path
    imgOutSize.value = r.size
    imgMime.value = mime
    uni.hideLoading()
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: (e && e.message) || '转换失败', icon: 'none' })
  } finally {
    imgBusy.value = false
  }
}

function saveImg() {
  if (!imgOut.value) return
  const name = imgMime.value === 'image/png' ? 'converted.png' : 'converted.jpg'
  saveOrDownload(imgOut.value, name)
}

const ts = ref('')
const tsOut = ref('')
const now = new Date()
const dateVal = ref(now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate()))
const timeVal = ref(pad2(now.getHours()) + ':' + pad2(now.getMinutes()))
const dateOut = ref('')

function onTs(e) {
  ts.value = String(e.detail.value || '').replace(/[^\d]/g, '').slice(0, 13)
  tsOut.value = ''
}

function ts2date() {
  const s = ts.value.trim()
  if (!s) {
    uni.showToast({ title: '请输入时间戳', icon: 'none' })
    return
  }
  let n = Number(s)
  if (!Number.isFinite(n)) {
    tsOut.value = '无效时间戳'
    return
  }
  if (s.length <= 10) n *= 1000
  if (n < 0 || n > 8640000000000) {
    tsOut.value = '超出范围'
    return
  }
  const d = new Date(n)
  if (Number.isNaN(d.getTime())) {
    tsOut.value = '无效时间戳'
    return
  }
  tsOut.value =
    d.getFullYear() +
    '-' +
    pad2(d.getMonth() + 1) +
    '-' +
    pad2(d.getDate()) +
    ' ' +
    pad2(d.getHours()) +
    ':' +
    pad2(d.getMinutes()) +
    ':' +
    pad2(d.getSeconds()) +
    '\n毫秒 ' +
    d.getTime() +
    '\n秒 ' +
    Math.floor(d.getTime() / 1000)
}

function onDate(e) {
  dateVal.value = e.detail.value
  dateOut.value = ''
}

function onTime(e) {
  timeVal.value = e.detail.value
  dateOut.value = ''
}

function date2ts() {
  const [y, m, d] = dateVal.value.split('-').map(Number)
  const parts = timeVal.value.split(':').map(Number)
  const hh = parts[0] || 0
  const mm = parts[1] || 0
  const ss = parts[2] || 0
  const dt = new Date(y, m - 1, d, hh, mm, ss)
  if (Number.isNaN(dt.getTime())) {
    dateOut.value = '无效日期'
    return
  }
  dateOut.value = '毫秒 ' + dt.getTime() + '\n秒 ' + Math.floor(dt.getTime() / 1000)
}

const colorIn = ref('#0f7a6c')

function parseColor(raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  let hex = s.replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return { r, g, b, hex: '#' + hex.toLowerCase() }
  }
  const m = s
    .replace(/\s/g, '')
    .match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,[\d.]+)?\)$/i) ||
    s.replace(/\s/g, '').match(/^(\d{1,3}),(\d{1,3}),(\d{1,3})$/)
  if (!m) return null
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  if ([r, g, b].some((x) => x > 255)) return null
  const h =
    '#' +
    [r, g, b]
      .map((x) => {
        const h = x.toString(16)
        return h.length < 2 ? '0' + h : h
      })
      .join('')
      .toLowerCase()
  return { r, g, b, hex: h }
}

const colorParsed = computed(() => parseColor(colorIn.value))
const colorCss = computed(() => (colorParsed.value ? colorParsed.value.hex : ''))
const colorOut = computed(() => {
  const c = colorParsed.value
  if (!c) return ''
  return c.hex + '\nrgb(' + c.r + ', ' + c.g + ', ' + c.b + ')'
})
const colorBad = computed(() => !!colorIn.value.trim() && !colorParsed.value)

function onColor(e) {
  colorIn.value = String(e.detail.value || '').slice(0, 32)
}

const jsonIn = ref('{\n  "ok": true\n}')
const jsonErr = ref('')

onHide(() => {
  uni.hideLoading()
})

function onJson(e) {
  jsonIn.value = String(e.detail.value || '').slice(0, 8000)
  jsonErr.value = ''
}

function jsonFmt(pretty) {
  try {
    const obj = JSON.parse(jsonIn.value)
    jsonIn.value = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
    jsonErr.value = ''
  } catch (e) {
    jsonErr.value = 'JSON 无法解析'
  }
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
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
  padding: 16rpx 0;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #646566;
}
.tab.on {
  background: #ffffff;
  color: #171a1d;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.card {
  background: #ffffff;
  border: none;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}
.lab {
  display: block;
  font-size: 24rpx;
  color: #8a8176;
  margin-bottom: 12rpx;
}
.inp {
  background: #f6f7f9;
  border-radius: 12rpx;
  height: 80rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}
.area {
  width: 100%;
  height: 360rpx;
  background: #f6f7f9;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 26rpx;
  margin-bottom: 16rpx;
}
.pick {
  min-height: 240rpx;
  background: #f7f8fa;
  border: 2rpx dashed #dcdee0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  overflow: hidden;
}
.preview {
  width: 100%;
  height: 300rpx;
}
.preview.sm {
  height: 200rpx;
  margin-bottom: 12rpx;
}
.ph {
  color: #969799;
  font-size: 26rpx;
}
.btns {
  display: flex;
  gap: 16rpx;
}
.btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.slim {
  margin-bottom: 16rpx;
}
.ghost {
  background: #f2f3f5;
  color: #171a1d;
}
.solid {
  background: linear-gradient(135deg, #0bc36a, #059e54);
  box-shadow: 0 6rpx 16rpx rgba(7, 193, 96, 0.25);
  color: #ffffff;
}
.outbox {
  margin-top: 20rpx;
}
.meta {
  display: block;
  font-size: 24rpx;
  color: #8a8176;
  margin-bottom: 12rpx;
}
.result {
  display: block;
  white-space: pre-wrap;
  font-size: 28rpx;
  color: #1f1b16;
  line-height: 1.6;
}
.err {
  display: block;
  margin-top: 12rpx;
  color: #c45c4a;
  font-size: 24rpx;
}
.div {
  height: 1px;
  background: #e7e0d6;
  margin: 28rpx 0;
}
.row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.grow {
  flex: 1;
  width: 0;
}
.pickbox {
  height: 80rpx;
  line-height: 80rpx;
  background: #f6f7f9;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}
.swatch {
  height: 80rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  border: 1px solid #ebedf0;
}
.offscreen {
  position: fixed;
  left: -9999px;
  width: 300px;
  height: 300px;
}
</style>
