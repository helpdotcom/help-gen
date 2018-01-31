'use strict'

exports.string = function string() {
  const STRING = require('./string')
  return new STRING()
}

exports.number = function number() {
  const NUMBER = require('./number')
  return new NUMBER()
}

exports.boolean = function boolean() {
  const BOOLEAN = require('./boolean')
  return new BOOLEAN()
}

exports.date = function date() {
  const DATE = require('./date')
  return new DATE()
}

exports.regex = function regex(re) {
  const REGEX = require('./regex')
  return new REGEX(re)
}

exports.uuid = function uuid() {
  const UUID = require('./uuid')
  return new UUID()
}

exports.email = function email() {
  const EMAIL = require('./email')
  return new EMAIL()
}

exports.url = function email() {
  const URL = require('./url')
  return new URL()
}

exports.array = function array() {
  const ARRAY = require('./array')
  return new ARRAY()
}

exports.enum = function(vals) {
  const ENUM = require('./enum')
  return new ENUM(vals)
}

exports.object = function object() {
  const OBJECT = require('./object')
  return new OBJECT()
}

exports.ref = function ref(name) {
  const REF = require('./ref')
  return new REF(name)
}

exports.ip = function ip() {
  const IP = require('./ip')
  return new IP()
}

const types = [
  'string'
, 'number'
, 'boolean'
, 'date'
, 'regex'
, 'uuid'
, 'url'
, 'email'
, 'array'
, 'enum'
, 'object'
, 'ref'
, 'ip'
]

Object.defineProperty(exports, '_types', {
  value: types.slice()
, configurable: false
, enumerable: false
, writable: false
})

exports.fromConfig = function fromConfig(config) {
  validateConfig(config)

  const item = exports[config.type]()
  for (const key of Object.keys(config)) {
    if (typeof item[key] === 'function' && config[key] !== null) {
      if (key === 'props' && item.passthrough !== true) {
        if (Array.isArray(config.props)) {
          if (config.props.length) {
            item.props(exports.fromConfigList(config.props, config))
          } else {
            item.props([])
          }
        } else {
          item.props(exports.fromConfig(config.props))
        }
      } else {
        if (key === 'passthrough') {
          if (config[key]) item[key](config[key])
        } else {
          item[key](config[key])
        }
      }
    }
  }
  return item
}

exports.fromConfigList = function fromConfigList(props, base) {
  if (!Array.isArray(props)) {
    throw new Error('props must be an array')
  }

  if (base) validateConfig(base)
  props.forEach(validateConfig)

  return props
    .filter((prop) => {
      return checkBase(prop, base) || checkArrayProp(prop, base)
    })
    .map(exports.fromConfig)
}

function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new TypeError('config must be an object')
  }

  if (!config.type) {
    throw new Error('type is required')
  }

  if (!~types.indexOf(config.type)) {
    throw new Error(`invalid config type: "${config.type}"`)
  }
}

function checkBase(prop, base) {
  if (!prop.displayPath) {
    return true
  }
  const expectedPath = base ? `${base.displayPath}.${prop.path}` : prop.path
  return prop.displayPath === expectedPath
}
function checkArrayProp(prop, base) {
  return prop.displayPath === null && base.type === 'array'
}

exports.isProp = require('./is-prop')
