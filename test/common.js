'use strict'

const tap = require('tap')

if (require.main === module) {
  tap.pass('skipping common.js')
  return
}

const assert = require('assert')
const path = require('path')
const Module = require('module').Module
const {ModelManager, Validator, Prop} = require('../')
const dir = __dirname
var count = 0

exports.createModule = function(code, opts) {
  count++
  const filepath = path.join(dir, `${count}.js`)
  const m = new Module(filepath, module)
  m.filename = filepath
  m.paths = Module._nodeModulePaths(path.dirname(filepath))

  assert(code.includes('use strict'), 'all code should be in strict mode')
  m.__hookedRequire = opts && opts.hookedRequire
  code =
`'use strict'
if (module.__hookedRequire) require = module.__hookedRequire
${code}`

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

exports.getNestedProp = function getNestedProp(type, val) {
  return function(name = type) {
    return Prop[type](val).path(`nested.${name}`)
  }
}

exports.compileValidator = function compileValidator(opts) {
  if (process.env.HELPGEN_STRIP_EXTRA_PROPS === '1') {
    opts.stripExtraneousProperties = true
  }

  if (process.env.HELPGEN_FAIL_EXTRA_PROPS === '1') {
    opts.failOnExtraneousProperties = true
  }

  const v = new Validator(opts)
  const code = v.generate()
  return exports.createModule(code, opts)
}

// Note: won't work with ref types
exports.compileManager = function compileManager(opts) {
  const out = new ModelManager({
    configs: [opts]
  }).generate()
  const code = out.get(opts.name).code
  return exports.createModule(code)
}

exports.getTestName = function getTestName(prop, includePath = true) {
  const type = prop._type
  const s = type === 'regex'
    ? prop._value
    : type === 'enum'
    ? `[${prop._values.join(',')}]`
    : ''
  let name = `Prop.${type}(${s})`
  if (includePath) name += `.path('${type}')`

  if (prop._required) {
    name += '.required(true)'
  } else {
    name += '.optional()'
  }

  if (prop._allowNull) name += '.allowNull()'

  if (prop._min && typeof prop._min === 'number') {
    name += `.min(${prop._min})`
  }

  if (prop._max && typeof prop._max === 'number') {
    name += `.max(${prop._max})`
  }

  if (prop._props) {
    const str = exports.getTestName(prop._props, false)
    name += `.props(${str})`
  }

  return name
}
