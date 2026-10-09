import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

export function useShare(title, path, image) {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline'],
  })
  // #endif
  const pic = () => (typeof image === 'function' ? image() : '')
  onShareAppMessage(() => {
    const o = { title: title, path: path }
    const img = pic()
    if (img) o.imageUrl = img
    return o
  })
  onShareTimeline(() => {
    const o = { title: title }
    const img = pic()
    if (img) o.imageUrl = img
    return o
  })
}
