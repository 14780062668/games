const fs = require('fs')
const path = require('path')
const ci = require('miniprogram-ci')

const root = path.join(__dirname, '..')
const outDir = path.join(root, 'dist', 'build', 'mp-weixin')
const DEFAULT_PRIVATE_KEY = 'private.wx3dd141820c627a49.key'

function readManifestAppId() {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(root, 'src', 'manifest.json'), 'utf8'))
    return (m['mp-weixin'] && m['mp-weixin'].appid) || ''
  } catch {
    return ''
  }
}

async function main() {
  const appid = process.env.WX_APPID || readManifestAppId()
  const keyRel = process.env.WX_PRIVATE_KEY_PATH || DEFAULT_PRIVATE_KEY
  const privateKeyPath = path.isAbsolute(keyRel) ? keyRel : path.join(root, keyRel)
  const version = process.env.WX_VERSION || require(path.join(root, 'package.json')).version
  const desc = process.env.WX_DESC || 'ci upload'

  if (!appid) {
    console.error('缺少 AppID：请在 src/manifest.json 的 mp-weixin.appid 填写，或设置环境变量 WX_APPID')
    process.exit(1)
  }
  if (!fs.existsSync(privateKeyPath)) {
    console.error('缺少私钥文件：请将密钥放在项目根目录 ' + DEFAULT_PRIVATE_KEY + '，或设置 WX_PRIVATE_KEY_PATH')
    process.exit(1)
  }
  if (!fs.existsSync(outDir)) {
    console.error('未找到构建目录，请先执行：npm run build:mp-weixin')
    process.exit(1)
  }

  const project = new ci.Project({
    appid,
    type: 'miniProgram',
    projectPath: outDir,
    privateKeyPath,
    ignores: ['node_modules/**/*'],
  })

  const uploadResult = await ci.upload({
    project,
    version,
    desc,
    setting: {
      es6: true,
      minify: true,
    },
  })
  console.log('上传成功', uploadResult.subPackageInfo || '')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
