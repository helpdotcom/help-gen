'use strict'

const tap = require('tap')

if (require.main === module) {
  tap.pass('skipping common.js')
  return
}

const path = require('path')
const Module = require('module').Module
const Prop = require('@helpdotcom/nano-prop')
const Validator = require('../').Validator
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

exports.getProp = function getProp(type, val) {
  return function(name = type) {
    return Prop[type](val).path(name)
  }
}

exports.compile = function compile(opts) {
  if (process.env.HELPGEN_STRIP_EXTRA_PROPS === '1') {
    opts.stripExtraneousProperties = true
  }

  if (process.env.HELPGEN_FAIL_EXTRA_PROPS === '1') {
    opts.failOnExtraneousProperties = true
  }

  const v = new Validator(opts)
  const code = v.generate()
  return exports.createModule(code)
}
