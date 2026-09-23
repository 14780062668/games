const PAGE_CSS =
  'body{margin:0;padding:16px;background:#fff;color:#000;font-size:16px;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;}p{margin:16px 0;}img{max-width:100%;height:auto;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;}'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function kids(el) {
  return Array.from(el.childNodes).map(inline).join('')
}

function inline(node) {
  if (node.nodeType === 3) return esc(node.nodeValue)
  if (node.nodeType !== 1) return ''
  const tag = node.tagName
  if (tag === 'BR') return '<br/>'
  if (tag === 'IMG') {
    const src = node.getAttribute('src') || ''
    return src ? '<img src="' + src.replace(/"/g, '') + '" />' : ''
  }
  if (tag === 'A') {
    const href = (node.getAttribute('href') || '').replace(/"/g, '')
    return '<a href="' + href + '">' + kids(node) + '</a>'
  }
  let html = kids(node)
  const cs = getComputedStyle(node)
  const bold = cs.fontWeight === 'bold' || Number(cs.fontWeight) >= 600
  if (bold) html = '<strong>' + html + '</strong>'
  return html
}

function pStyle(el) {
  const cs = getComputedStyle(el)
  const st = []
  if (cs.textAlign === 'center' || cs.textAlign === 'right') st.push('text-align: ' + cs.textAlign)
  if (parseFloat(cs.textIndent) > 8) st.push('text-indent: 21pt')
  return st.length ? ' style="' + st.join('; ') + ';"' : ''
}

function toArticle(root) {
  const parts = []
  const blocks = root.querySelectorAll('p, table, h1, h2, h3')
  blocks.forEach((el) => {
    if (el.closest('table') && el.tagName !== 'TABLE') return
    if (el.tagName === 'TABLE') {
      const clone = el.cloneNode(true)
      clone.querySelectorAll('[class]').forEach((n) => n.removeAttribute('class'))
      parts.push(clone.outerHTML)
      return
    }
    const text = (el.innerText || '').replace(/\u00a0/g, ' ').trim()
    if (!text && !el.querySelector('img')) {
      parts.push('<p> </p>')
      return
    }
    parts.push('<p' + pStyle(el) + '>' + kids(el) + '</p>')
  })
  return parts.join('\n')
}

export async function docxToHtml(buf) {
  // #ifdef H5
  const { renderAsync } = await import('docx-preview')
  const box = document.createElement('div')
  box.style.cssText = 'position:fixed;left:-99999px;top:0;width:375px;'
  document.body.appendChild(box)
  try {
    await renderAsync(buf, box, null, {
      className: 'docx',
      inWrapper: false,
      ignoreWidth: true,
      ignoreHeight: true,
      ignoreFonts: true,
      breakPages: false,
      useBase64URL: true,
      renderHeaders: false,
      renderFooters: false,
      ignoreLastRenderedPageBreak: true,
    })
    const root = box.querySelector('article') || box
    return toArticle(root)
  } finally {
    box.remove()
  }
  // #endif
  // #ifndef H5
  throw new Error('请在网页中转换')
  // #endif
}

export function wrapHtml(title, inner) {
  const t = String(title || 'document').replace(/[<>&"]/g, '')
  return (
    '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>' +
    t +
    '</title>\n<style>' +
    PAGE_CSS +
    '</style>\n</head>\n<body>\n' +
    inner +
    '\n</body>\n</html>'
  )
}
