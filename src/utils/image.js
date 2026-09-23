function isH5() {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

export function fmtSize(n) {
  const x = Number(n)
  if (!x || x < 0) return '0 B'
  if (x < 1024) return x + ' B'
  if (x < 1048576) return (x / 1024).toFixed(1) + ' KB'
  return (x / 1048576).toFixed(2) + ' MB'
}

export function getFileSize(path) {
  return new Promise((resolve) => {
    if (!path) {
      resolve(0)
      return
    }
    if (isH5()) {
      if (path.startsWith('data:')) {
        const i = path.indexOf(',')
        const b64 = i >= 0 ? path.slice(i + 1) : ''
        resolve(Math.floor((b64.length * 3) / 4))
        return
      }
      fetch(path)
        .then((r) => r.blob())
        .then((b) => resolve(b.size))
        .catch(() => resolve(0))
      return
    }
    uni.getFileInfo({
      filePath: path,
      success: (r) => resolve(r.size || 0),
      fail: () => resolve(0),
    })
  })
}

import { requirePrivacy } from './privacy.js'

function pickFail(err, reject) {
  const msg = (err && (err.errMsg || err.message)) || ''
  if (/cancel/i.test(msg)) {
    reject(new Error('cancel'))
    return
  }
  reject(new Error(msg || '选择失败'))
}

export function pickImage() {
  return requirePrivacy().then(
    () =>
      new Promise((resolve, reject) => {
        const done = (path) => {
          if (!path) {
            reject(new Error('未选择图片'))
            return
          }
          resolve(path)
        }
        if (typeof uni.chooseMedia === 'function') {
          uni.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album'],
            success: (res) => {
              const f = res.tempFiles && res.tempFiles[0]
              done((f && (f.tempFilePath || f.path)) || '')
            },
            fail: (err) => pickFail(err, reject),
          })
          return
        }
        uni.chooseImage({
          count: 1,
          sizeType: ['original'],
          sourceType: ['album'],
          success: (res) => done((res.tempFilePaths && res.tempFilePaths[0]) || ''),
          fail: (err) => pickFail(err, reject),
        })
      })
  )
}

function h5Draw(src, mime, quality, maxEdge) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.naturalWidth || img.width
      let h = img.naturalHeight || img.height
      if (!w || !h) {
        reject(new Error('无法读取图片'))
        return
      }
      const edge = maxEdge || 4096
      if (w > edge || h > edge) {
        const s = edge / Math.max(w, h)
        w = Math.max(1, Math.round(w * s))
        h = Math.max(1, Math.round(h * s))
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('画布不可用'))
        return
      }
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(img, 0, 0, w, h)
      let q = Number(quality)
      if (!(q >= 0 && q <= 1)) q = 0.8
      try {
        const dataUrl = canvas.toDataURL(mime, q)
        resolve(dataUrl)
      } catch (e) {
        reject(new Error('转换失败'))
      }
    }
    img.onerror = () => reject(new Error('图片读取失败'))
    img.src = src
  })
}

export function compressToJpeg(src, quality) {
  const q = Math.min(100, Math.max(10, Math.round(Number(quality) || 80)))
  if (isH5()) {
    return h5Draw(src, 'image/jpeg', q / 100, 2560).then((path) =>
      getFileSize(path).then((size) => ({ path, size }))
    )
  }
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality: q,
      success: (res) => {
        const path = res.tempFilePath
        getFileSize(path).then((size) => resolve({ path, size }))
      },
      fail: (err) => reject(new Error((err && err.errMsg) || '压缩失败')),
    })
  })
}

export function convertImage(src, mime) {
  if (isH5()) {
    const q = mime === 'image/jpeg' ? 0.92 : 0.92
    return h5Draw(src, mime, q, 4096).then((path) =>
      getFileSize(path).then((size) => ({ path, size }))
    )
  }
  // 小程序无直接转 PNG，用压缩近似 JPEG；PNG 走 canvas
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery()
    query
      .select('#fmtCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const node = res && res[0] && res[0].node
        if (!node) {
          reject(new Error('画布未就绪'))
          return
        }
        const ctx = node.getContext('2d')
        const img = node.createImage()
        img.onload = () => {
          let w = img.width
          let h = img.height
          const edge = 2560
          if (w > edge || h > edge) {
            const s = edge / Math.max(w, h)
            w = Math.max(1, Math.round(w * s))
            h = Math.max(1, Math.round(h * s))
          }
          node.width = w
          node.height = h
          if (mime === 'image/jpeg') {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, w, h)
          } else {
            ctx.clearRect(0, 0, w, h)
          }
          ctx.drawImage(img, 0, 0, w, h)
          uni.canvasToTempFilePath({
            canvas: node,
            fileType: mime === 'image/png' ? 'png' : 'jpg',
            quality: 0.92,
            success: (r) => {
              getFileSize(r.tempFilePath).then((size) =>
                resolve({ path: r.tempFilePath, size })
              )
            },
            fail: () => reject(new Error('导出失败')),
          })
        }
        img.onerror = () => reject(new Error('图片读取失败'))
        img.src = src
      })
  })
}

export function saveOrDownload(path, filename) {
  if (isH5()) {
    try {
      const a = document.createElement('a')
      a.href = path
      a.download = filename || 'image.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      uni.showToast({ title: '已开始下载', icon: 'none' })
    } catch (e) {
      uni.showToast({ title: '请长按图片保存', icon: 'none' })
    }
    return
  }
  requirePrivacy()
    .then(() => {
      uni.saveImageToPhotosAlbum({
        filePath: path,
        success: () => uni.showToast({ title: '已保存到相册' }),
        fail: (err) => {
          const msg = (err && err.errMsg) || ''
          if (/auth deny|authorize/i.test(msg)) {
            uni.showModal({
              title: '需要相册权限',
              content: '请在设置中允许保存到相册',
              confirmText: '去设置',
              success: (r) => {
                if (r.confirm) uni.openSetting({})
              },
            })
            return
          }
          uni.showToast({ title: '保存失败', icon: 'none' })
        },
      })
    })
    .catch(() => {})
}
