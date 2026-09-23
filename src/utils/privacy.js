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
    uni.requirePrivacyAuthorize({
      success: () => resolve(),
      fail: () => reject(new Error('cancel')),
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve()
    // #endif
  })
}
