export function load(key, fallback) {
  try {
    const raw = uni.getStorageSync(key)
    if (raw === '' || raw === undefined || raw === null) return fallback
    return raw
  } catch (e) {
    return fallback
  }
}

export function save(key, val) {
  try {
    uni.setStorageSync(key, val)
    return true
  } catch (e) {
    uni.showToast({ title: '存储失败，空间可能已满', icon: 'none' })
    return false
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
