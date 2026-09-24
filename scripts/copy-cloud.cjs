const fs = require('fs')
const path = require('path')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name)
    const d = path.join(dest, name)
    if (fs.statSync(s).isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

const root = path.join(__dirname, '..')
const from = path.join(root, 'cloudfunctions')
const targets = [
  path.join(root, 'dist', 'build', 'mp-weixin', 'cloudfunctions'),
  path.join(root, 'dist', 'dev', 'mp-weixin', 'cloudfunctions'),
]

for (const to of targets) {
  const parent = path.dirname(to)
  if (!fs.existsSync(parent)) continue
  copyDir(from, to)
  console.log('已复制云函数 ->', to)
}
