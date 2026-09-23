#!/usr/bin/env node
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const exe = process.platform === 'win32' ? 'node.exe' : 'node'
const bin = path.join(__dirname, '..', 'node_modules', 'node', 'bin', exe)
if (!fs.existsSync(bin)) {
  console.error('缺少本地 Node，请执行 npm install')
  process.exit(1)
}

const child = spawn(bin, [path.join(__dirname, 'uni.cjs'), ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
})
child.on('exit', (code) => process.exit(code == null ? 1 : code))
