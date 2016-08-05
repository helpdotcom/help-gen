'use strict'

const tap = require('tap')

if (require.main === module) {
  tap.pass('skipping common.js')
  return
}

const path = require('path')
const Module = require('module').Module
const dir = __dirname
var count = 0

exports.createModule = function(code) {
  count++
  const filepath = path.join(dir, `${count}.js`)
  const m = new Module(filepath, module)
  m.filename = filepath
  m.paths = Module._nodeModulePaths(path.dirname(filepath))
  m._compile(code, filepath)
  const key = JSON.stringify({
    request: filepath
  , paths: ['']
  })

  Module._cache[filepath] = m
  Module._pathCache[key] = filepath
  return m.exports
}
