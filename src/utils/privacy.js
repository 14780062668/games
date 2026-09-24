let resolveNeed = null

export function setPrivacyResolve(fn) {
  resolveNeed = fn
}

export function acceptPrivacy() {
  if (resolveNeed) resolveNeed({ event: 'agree', buttonId: 'agree-btn' })
  resolveNeed = null
}

export function denyPrivacy() {
  if (resolveNeed) resolveNeed({ event: 'disagree' })
  resolveNeed = null
}

export function requirePrivacy() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    if (typeof uni.requirePrivacyAuthorize !== 'function') {
      resolve()
      return
    }
    let done = false
    const finish = (ok) => {
      if (done) return
      done = true
      if (ok) resolve()
      else reject(new Error('cancel'))
    }
    // 超时放行，避免审核卡死白屏
    const timer = setTimeout(() => finish(true), 8000)
    uni.requirePrivacyAuthorize({
      success: () => {
        clearTimeout(timer)
        finish(true)
      },
      fail: () => {
        clearTimeout(timer)
        finish(false)
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve()
    // #endif
  })
}
