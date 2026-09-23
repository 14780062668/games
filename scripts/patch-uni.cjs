#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

function rewrite(file, fn) {
  if (!fs.existsSync(file)) return
  const s = fs.readFileSync(file, 'utf8')
  const n = fn(s)
  if (n && n !== s) fs.writeFileSync(file, n)
}

const root = path.join(__dirname, '..', 'node_modules')
const dcloud = path.join(root, '@dcloudio')

const safeExtendEsm =
  '(function(s,c){for(const k in c){if(k!=="_")s[k]=c[k]}if("_" in c)def(s,"_",c._,true)})(slots, children)'
const safeExtendCjs =
  '(function(s,c){for(const k in c){if(k!=="_")s[k]=c[k]}if("_" in c)shared.def(s,"_",c._,true)})(slots, children)'

function patchVueRuntime(file) {
  const cjs = file.endsWith('.cjs.js')
  rewrite(file, (s) => {
    s = s.split('def(children, "_", type);').join('def(children, "_", type, true);')
    s = s.split('shared.def(children, "_", type);').join('shared.def(children, "_", type, true);')
    s = s.split('children._ = 1;').join(
      cjs ? 'shared.def(children, "_", 1, true);' : 'def(children, "_", 1, true);'
    )
    s = s.split('children._ = 2;').join(
      cjs ? 'shared.def(children, "_", 2, true);' : 'def(children, "_", 2, true);'
    )
    s = s.split('extend(slots, children);').join(safeExtendEsm + ';')
    s = s.split('shared.extend(slots, children);').join(safeExtendCjs + ';')
    return s
  })
}

for (const pkg of ['uni-h5-vue', 'uni-mp-vue']) {
  const files = walk(path.join(dcloud, pkg)).filter((f) => /vue\.runtime\.(esm|cjs)\.js$/.test(f))
  for (const f of files) patchVueRuntime(f)
}

rewrite(
  path.join(dcloud, 'uni-mp-vite', 'dist', 'plugins', 'mainJs.js'),
  (s) => s.split('resolve: this.resolve,').join('resolve: this.resolve.bind(this),')
)

function patchSharedDef(file) {
  rewrite(file, (s) =>
    s.replace(
      /writable,\s*value/g,
      'writable: key === "_" || writable, value'
    )
  )
}

const sharedDir = path.join(root, '@vue', 'shared', 'dist')
if (fs.existsSync(sharedDir)) {
  for (const name of fs.readdirSync(sharedDir)) {
    if (/\.(js|mjs|cjs)$/.test(name)) patchSharedDef(path.join(sharedDir, name))
  }
}
