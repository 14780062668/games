let resolveNeed = null

export function setPrivacyResolve(fn) {
  resolveNeed = fn
}

export function acceptPrivacy() {
  const fn = resolveNeed
  resolveNeed = null
  if (!fn) return
  try {
    fn({ event: 'agree', buttonId: 'agree-btn' })
  } catch (e) {}
}

export function denyPrivacy() {
  const fn = resolveNeed
  resolveNeed = null
  if (!fn) return
  try {
    fn({ event: 'disagree' })
  } catch (e) {}
}

// 返回或跳转失败时必须结束授权，否则微信蒙层会一直盖住页面
export function settlePrivacyOnLeave() {
  if (resolveNeed) denyPrivacy()
}

function finishOnce(resolve, reject) {
  let done = false
  return (ok) => {
    if (done) return
    done = true
    if (ok) resolve()
    else reject(new Error('cancel'))
  }
}

function askPrivacy(finish) {
  if (typeof uni.requirePrivacyAuthorize !== 'function') {
    finish(true)
    return
  }
  uni.requirePrivacyAuthorize({
    success: () => finish(true),
    fail: () => finish(false),
  })
}

export function requirePrivacy() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const finish = finishOnce(resolve, reject)
    // 已同意过就不再弹层，避免审核时蒙层盖住页面
    if (typeof wx !== 'undefined' && typeof wx.getPrivacySetting === 'function') {
      wx.getPrivacySetting({
        success: (res) => {
          if (res && res.needAuthorization) askPrivacy(finish)
          else finish(true)
        },
        fail: () => askPrivacy(finish),
      })
      return
    }
    askPrivacy(finish)
    // #endif
    // #ifndef MP-WEIXIN
    resolve()
    // #endif
  })
}
