<template>
  <view class="page">
    <view class="card">
      <view class="pick" @tap="choose">
        <text class="ph">{{ fileName || '选择 .docx 文件，转为 HTML' }}</text>
      </view>
      <view class="btns">
        <view class="btn ghost" @tap="choose">选择文件</view>
        <view v-if="html" class="btn solid" @tap="saveHtml">生成 HTML</view>
      </view>
      <text v-if="err" class="err">{{ err }}</text>
    </view>

    <view v-if="html" class="card">
      <text class="lab">预览</text>
      <!-- #ifdef H5 -->
      <view class="preview">
        <view class="article" v-html="html" />
      </view>
      <!-- #endif -->
      <text class="lab">HTML 源码</text>
      <textarea class="area" :value="html" disabled />
      <view class="btn solid slim" @tap="copyHtml">复制源码</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onHide } from '@dcloudio/uni-app'
import { docxToHtml, wrapHtml } from '../../utils/docx.js'

const fileName = ref('')
const html = ref('')
const err = ref('')
const busy = ref(false)

onHide(() => {
  uni.hideLoading()
})

function toast(title) {
  const o = Object.create(null)
  o.title = String(title)
  o.icon = 'none'
  uni.showToast(o)
}

async function run(name, buf) {
  const n = String(name || '')
  fileName.value = n
  html.value = ''
  err.value = ''
  if (!n.toLowerCase().endsWith('.docx')) {
    err.value = '仅支持 .docx 文件'
    return
  }
  if (!buf || !buf.byteLength) {
    err.value = '文件为空'
    return
  }
  if (buf.byteLength > 8 * 1024 * 1024) {
    err.value = '文件超过 8MB'
    return
  }
  busy.value = true
  uni.showLoading({ title: '转换中', mask: true })
  try {
    const out = await docxToHtml(buf)
    if (!out) {
      err.value = '转换结果为空'
      return
    }
    html.value = out
  } catch (e) {
    err.value = (e && e.message) || '转换失败，请确认文件是否为有效的 .docx'
  } finally {
    uni.hideLoading()
    busy.value = false
  }
}

function choose() {
  if (busy.value) return
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  input.onchange = async () => {
    const file = input.files && input.files[0]
    if (!file) return
    try {
      await run(file.name, await file.arrayBuffer())
    } catch (e) {
      err.value = '读取失败'
    }
  }
  input.click()
  // #endif
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['docx'],
    success: (res) => {
      const f = res.tempFiles && res.tempFiles[0]
      if (!f) return
      uni.getFileSystemManager().readFile({
        filePath: f.path,
        success: (r) => run(f.name || 'document.docx', r.data),
        fail: () => toast('读取失败'),
      })
    },
  })
  // #endif
}

function saveHtml() {
  if (!html.value) return
  const title = fileName.value.replace(/\.docx$/i, '') || 'document'
  const content = wrapHtml(title, html.value)
  // #ifdef H5
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = title + '.html'
  a.click()
  URL.revokeObjectURL(url)
  toast('已开始下载')
  // #endif
  // #ifdef MP-WEIXIN
  const path = (wx.env && wx.env.USER_DATA_PATH ? wx.env.USER_DATA_PATH : '') + '/' + title + '.html'
  uni.getFileSystemManager().writeFile({
    filePath: path,
    data: content,
    encoding: 'utf8',
    success: () => {
      uni.openDocument({
        filePath: path,
        fileType: 'html',
        showMenu: true,
        fail: () => toast('已保存，可复制源码'),
      })
    },
    fail: () => toast('保存失败'),
  })
  // #endif
}

function copyHtml() {
  if (!html.value) return
  const title = fileName.value.replace(/\.docx$/i, '') || 'document'
  uni.setClipboardData({
    data: wrapHtml(title, html.value),
    success: () => toast('已复制'),
  })
}
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.card {
  background: #ffffff;
  border: none;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}
.pick {
  min-height: 200rpx;
  background: #f7f8fa;
  border: 2rpx dashed #dcdee0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  padding: 24rpx;
}
.ph {
  color: #969799;
  font-size: 26rpx;
  text-align: center;
  word-break: break-all;
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
  margin-top: 16rpx;
}
.ghost {
  background: #f2f3f5;
  color: #171a1d;
}
.solid {
  background: #07c160;
  color: #ffffff;
}
.err {
  display: block;
  margin-top: 16rpx;
  color: #c45c4a;
  font-size: 24rpx;
}
.lab {
  display: block;
  font-size: 24rpx;
  color: #8a8278;
  margin-bottom: 12rpx;
}
.preview {
  max-height: 720rpx;
  overflow: auto;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}
.article {
  padding: 16px;
  background: #fff;
  color: #000;
  font-size: 16px;
  line-height: 1.75;
}
.article :deep(p) {
  margin: 16px 0;
}
.article :deep(img) {
  max-width: 100%;
  height: auto;
}
.area {
  width: 100%;
  height: 320rpx;
  background: #f6f7f9;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 22rpx;
  box-sizing: border-box;
}
</style>
