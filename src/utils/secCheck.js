import { CLOUD_ENV } from '../config.js'

let inited = false

function isMp() {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

export function initCloud() {
  if (!isMp() || inited) return false
  try {
    if (typeof wx === 'undefined' || !wx.cloud) return false
    const opt = { traceUser: true }
    if (CLOUD_ENV) opt.env = CLOUD_ENV
    wx.cloud.init(opt)
    inited = true
    return true
  } catch (e) {
    return false
  }
}

function callSec(data) {
  return new Promise((resolve) => {
    if (!isMp() || !initCloud() || typeof wx === 'undefined' || !wx.cloud) {
      resolve({ ok: true, skipped: true, raw: null })
      return
    }
    let done = false
    const finish = (r) => {
      if (done) return
      done = true
      resolve(r)
    }
    // 云函数挂起时不能一直盖住页面
    const timer = setTimeout(() => finish({ ok: true, skipped: true, err: 'timeout' }), 8000)
    wx.cloud.callFunction({
      name: 'contentSecCheck',
      data,
      success: (res) => {
        clearTimeout(timer)
        finish((res && res.result) || { ok: true, skipped: true })
      },
      // 云未开通/未部署时不抛错，避免阻断核心功能
      fail: (err) => {
        clearTimeout(timer)
        finish({
          ok: true,
          skipped: true,
          err: (err && err.errMsg) || 'call_fail',
          raw: null,
        })
      },
    })
  })
}

function uploadTemp(filePath) {
  return new Promise((resolve, reject) => {
    if (!initCloud() || !wx.cloud) {
      reject(new Error('cloud_unavailable'))
      return
    }
    const cloudPath =
      'seccheck/' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + '.jpg'
    const timer = setTimeout(() => reject(new Error('上传超时')), 8000)
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (r) => {
        clearTimeout(timer)
        resolve(r.fileID)
      },
      fail: (err) => {
        clearTimeout(timer)
        reject(new Error((err && err.errMsg) || '上传失败'))
      },
    })
  })
}

/** 文本内容安全 msgSecCheck */
export function checkMsg(content) {
  const text = String(content || '').trim()
  if (!text) return Promise.resolve({ ok: true, skipped: true, raw: null })
  if (!isMp()) return Promise.resolve({ ok: true, skipped: true, raw: null })
  return callSec({ type: 'msg', content: text })
}

/** 图片同步检测 imgSecCheck */
export async function checkImg(filePath) {
  if (!isMp() || !filePath) return { ok: true, skipped: true, raw: null }
  try {
    const fileID = await uploadTemp(filePath)
    return await callSec({ type: 'img', fileID })
  } catch (e) {
    return { ok: true, skipped: true, err: (e && e.message) || 'img_fail', raw: null }
  }
}

/** 多媒体异步检测 mediaCheckAsync */
export async function checkMedia(filePath) {
  if (!isMp() || !filePath) return { ok: true, skipped: true, raw: null }
  try {
    const fileID = await uploadTemp(filePath)
    return await callSec({ type: 'media', fileID })
  } catch (e) {
    return { ok: true, skipped: true, err: (e && e.message) || 'media_fail', raw: null }
  }
}

function passed(r) {
  if (!r || r.ok || r.skipped) return true
  const err = String(r.err || '')
  // 87014 是内容违规，不能当成接口故障放行
  if (/87014/.test(err)) return false
  if (r.err) return true
  return false
}

function showMask(title) {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    setTimeout(finish, 400)
    uni.showLoading({ title, mask: true, complete: finish })
  })
}

/** 未通过则 toast，通过返回 true。非小程序不弹检测层。 */
export async function ensureSafeMsg(content) {
  if (!isMp()) return true
  await showMask('内容检测中')
  try {
    const r = await checkMsg(content)
    uni.hideLoading()
    if (!passed(r)) {
      uni.showToast({ title: '内容未通过安全检测', icon: 'none' })
      return false
    }
    return true
  } catch (e) {
    uni.hideLoading()
    return true
  }
}

export async function ensureSafeImg(filePath) {
  if (!isMp()) return true
  await showMask('图片检测中')
  try {
    const r = await checkImg(filePath)
    uni.hideLoading()
    if (!passed(r)) {
      uni.showToast({ title: '图片未通过安全检测', icon: 'none' })
      return false
    }
    return true
  } catch (e) {
    uni.hideLoading()
    return true
  }
}
