import qrcode from 'qrcode-generator'

function isH5() {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

// 库默认只取低 8 位，中文会错码，改成 UTF-8
qrcode.stringToBytes = function (s) {
  const bytes = []
  const str = String(s)
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const c2 = str.charCodeAt(i + 1)
      if (c2 >= 0xdc00 && c2 <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00)
        i++
      }
    }
    if (c < 0x80) bytes.push(c)
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
    else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
    else bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
  }
  return bytes
}

function paint(ctx, qr, cell, margin, size) {
  const n = qr.getModuleCount()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#1f1b16'
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue
      ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell)
    }
  }
}

function makeQr(text) {
  const qr = qrcode(0, 'M')
  qr.addData(text, 'Byte')
  qr.make()
  return qr
}

function drawH5(qr) {
  const cell = 8
  const margin = 4
  const size = (qr.getModuleCount() + margin * 2) * cell
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('画布不可用')
  paint(ctx, qr, cell, margin, size)
  return canvas.toDataURL('image/png')
}

function drawMp(qr) {
  const cell = 8
  const margin = 4
  const size = (qr.getModuleCount() + margin * 2) * cell
  return new Promise((resolve, reject) => {
    uni
      .createSelectorQuery()
      .select('#qrCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const node = res && res[0] && res[0].node
        if (!node) {
          reject(new Error('画布未就绪'))
          return
        }
        const ctx = node.getContext('2d')
        const dpr = (uni.getSystemInfoSync().pixelRatio || 2)
        node.width = size * dpr
        node.height = size * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        paint(ctx, qr, cell, margin, size)
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvas: node,
            fileType: 'png',
            success: (r) => resolve(r.tempFilePath),
            fail: () => reject(new Error('导出失败')),
          })
        }, 30)
      })
  })
}

/** 本地生成二维码图片路径或 dataURL */
export async function renderQr(text) {
  let qr
  try {
    qr = makeQr(String(text || ''))
  } catch (e) {
    throw new Error('内容过长，请缩短')
  }
  if (isH5()) return drawH5(qr)
  return drawMp(qr)
}
