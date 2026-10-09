const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 内容安全检测云函数
 * event.type: msg | img | media
 */
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const type = event && event.type

  try {
    if (type === 'msg') {
      const content = String((event && event.content) || '').trim()
      if (!content) {
        return { ok: false, err: 'empty', raw: null }
      }
      // 文本安全检测 msgSecCheck
      const raw = await cloud.openapi.security.msgSecCheck({
        version: 2,
        scene: 2,
        openid,
        content,
      })
      const suggest = (raw && raw.result && raw.result.suggest) || ''
      const errCode = raw && (raw.errCode != null ? raw.errCode : raw.errcode)
      const pass = errCode === 0 && (suggest === 'pass' || !suggest)
      return { ok: pass, api: 'msgSecCheck', raw, suggest }
    }

    if (type === 'img') {
      const fileID = event && event.fileID
      if (!fileID) {
        return { ok: false, err: 'no_file', raw: null }
      }
      const dl = await cloud.downloadFile({ fileID })
      const buf = Buffer.isBuffer(dl.fileContent) ? dl.fileContent : Buffer.from(dl.fileContent || [])
      let contentType = 'image/jpeg'
      if (buf[0] === 0x89 && buf[1] === 0x50) contentType = 'image/png'
      else if (buf[0] === 0x47 && buf[1] === 0x49) contentType = 'image/gif'
      // 图片同步检测 imgSecCheck
      const raw = await cloud.openapi.security.imgSecCheck({
        media: {
          contentType,
          value: buf,
        },
      })
      const errCode = raw && (raw.errCode != null ? raw.errCode : raw.errcode)
      return { ok: errCode === 0, api: 'imgSecCheck', raw }
    }

    if (type === 'media') {
      let mediaUrl = (event && event.mediaUrl) || ''
      const fileID = event && event.fileID
      if (!mediaUrl && fileID) {
        const urls = await cloud.getTempFileURL({ fileList: [fileID] })
        mediaUrl = (urls.fileList && urls.fileList[0] && urls.fileList[0].tempFileURL) || ''
      }
      if (!mediaUrl) {
        return { ok: false, err: 'no_url', raw: null }
      }
      // 多媒体异步检测 mediaCheckAsync
      const raw = await cloud.openapi.security.mediaCheckAsync({
        version: 2,
        scene: 2,
        openid,
        mediaUrl,
        mediaType: 2,
      })
      const errCode = raw && (raw.errCode != null ? raw.errCode : raw.errcode)
      return {
        ok: errCode === 0,
        api: 'mediaCheckAsync',
        raw,
        traceId: raw && (raw.traceId || raw.trace_id),
      }
    }

    return { ok: false, err: 'bad_type', raw: null }
  } catch (e) {
    return {
      ok: false,
      err: (e && (e.errMsg || e.message)) || 'check_fail',
      raw: e,
    }
  }
}
