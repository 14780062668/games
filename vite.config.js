import { defineConfig } from 'vite'
import uniMod from '@dcloudio/vite-plugin-uni'

const uni = uniMod.default || uniMod

function patchUniVue() {
  const safeEsm =
    '(function(s,c){for(const k in c){if(k!=="_")s[k]=c[k]}if("_" in c)def(s,"_",c._,true)})(slots, children);'
  const safeCjs =
    '(function(s,c){for(const k in c){if(k!=="_")s[k]=c[k]}if("_" in c)shared.def(s,"_",c._,true)})(slots, children);'
  return {
    name: 'patch-uni-vue',
    enforce: 'pre',
    transform(code, id) {
      const n = id.replace(/\\/g, '/')
      if (n.includes('@vue/shared') && !code.includes('key === "_" || writable')) {
        return code.replace(/writable,\s*value/g, 'writable: key === "_" || writable, value')
      }
      if (!n.includes('@dcloudio/uni-h5-vue') && !n.includes('@dcloudio/uni-mp-vue')) return
      if (!/vue\.runtime\.(esm|cjs)\.js/.test(n)) return
      if (code.includes('if(k!=="_")')) return
      const cjs = n.endsWith('.cjs.js')
      const defn = cjs ? 'shared.def' : 'def'
      return code
        .replaceAll('def(children, "_", type);', 'def(children, "_", type, true);')
        .replaceAll('shared.def(children, "_", type);', 'shared.def(children, "_", type, true);')
        .replaceAll('children._ = 1;', defn + '(children, "_", 1, true);')
        .replaceAll('children._ = 2;', defn + '(children, "_", 2, true);')
        .replaceAll('shared.extend(slots, children);', safeCjs)
        .replaceAll('extend(slots, children);', safeEsm)
    },
  }
}

export default defineConfig({
  plugins: [patchUniVue(), uni()],
  optimizeDeps: {
    exclude: ['@dcloudio/uni-h5-vue', '@vue/shared'],
  },
})
