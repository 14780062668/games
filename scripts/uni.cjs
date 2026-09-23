#!/usr/bin/env node
/**
 * uni CLI 用 require('vite')，Vite 6+ 是纯 ESM。
 * 先动态 import，再拦截 Module._load。
 */
const Module = require('module')
const origLoad = Module._load

const ESM_PKGS = new Set([
  'vite',
  '@vitejs/plugin-vue',
  '@vitejs/plugin-vue-jsx',
  '@vitejs/plugin-legacy',
])

function toCjs(ns) {
  const def = ns && ns.default !== undefined ? ns.default : ns
  if (typeof def === 'function') {
    const fn = function (...args) {
      return def.apply(this, args)
    }
    Object.assign(fn, ns)
    fn.default = def
    fn.__esModule = true
    return fn
  }
  const out = Object.assign({ __esModule: true }, ns)
  if (ns && ns.default !== undefined) out.default = ns.default
  return out
}

async function main() {
  const cache = Object.create(null)
  for (const id of ESM_PKGS) {
    cache[id] = toCjs(await import(id))
  }
  try {
    cache['unplugin-auto-import/vite'] = toCjs(await import('unplugin-auto-import/vite'))
  } catch (_) {}

  Module._load = function (request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(cache, request)) {
      return cache[request]
    }
    return origLoad.call(this, request, parent, isMain)
  }

  require('@dcloudio/vite-plugin-uni/bin/uni.js')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
