const fs = require('fs')
const path = require('path')

const p = path.join(
  __dirname,
  '..',
  'node_modules',
  'miniprogram-ci',
  'dist',
  'schema',
  'dist',
  'app.js'
)
if (!fs.existsSync(p)) {
  console.warn('skip patch-ci: schema not found')
  process.exit(0)
}

let s = fs.readFileSync(p, 'utf8')
const add = [
  'chooseImage',
  'chooseMedia',
  'saveImageToPhotosAlbum',
]

// 在每一处 startLocationUpdateBackground 枚举末尾补齐隐私接口
const re = /"startLocationUpdateBackground"/g
let n = 0
s = s.replace(re, (m) => {
  n++
  // 已补过则跳过（下一项已是 chooseImage）
  return m
})

// 更稳妥：按未包含 chooseImage 的枚举块整体替换
const blockRe =
  /\[[\s\n]*"chooseAddress",[\s\S]*?"startLocationUpdateBackground"[\s\n]*\]/g
s = fs.readFileSync(p, 'utf8')
let count = 0
s = s.replace(blockRe, (block) => {
  if (block.includes('"chooseImage"')) return block
  count++
  return block.replace(
    '"startLocationUpdateBackground"',
    '"startLocationUpdateBackground",\n              "chooseImage",\n              "chooseMedia",\n              "saveImageToPhotosAlbum"'
  )
})

if (count === 0 && s.includes('"chooseImage"')) {
  console.log('patch-ci: already ok')
  process.exit(0)
}
if (count === 0) {
  console.error('patch-ci: no block matched')
  process.exit(1)
}

fs.writeFileSync(p, s)
const app = require(p)
const enumList = app.properties.requiredPrivateInfos.items.enum
if (!enumList.includes('chooseImage')) {
  console.error('patch-ci: require still missing chooseImage', enumList)
  process.exit(1)
}
console.log('patch-ci: patched', count, 'blocks')
