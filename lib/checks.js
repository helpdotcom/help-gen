'use strict'

const utils = require('./utils')

exports.checkName = function checkName(name) {
  if (!name) {
    throw new Error('name is required')
  }

  if (typeof name !== 'string' || utils.varNeedsBrackets(name)) {
    throw new TypeError('name must be a string that is a valid identifier')
  }
}

exports.checkProps = function checkProps(ar) {
  if (!Array.isArray(ar)) {
    throw new TypeError('props is required and must be an Array')
  }
}

exports.checkValidation = function checkValidation(obj) {
  if (!obj.type) {
    throw new Error('Invalid rule. `type` is required')
  }

  if (typeof obj.type !== 'string') {
    throw new TypeError('Invalid rule. `type` must be a string')
  }

  if (!obj.path) {
    throw new Error('Invalid rule. `path` is required')
  }

  if (typeof obj.path !== 'string') {
    throw new TypeError('Invalid rule. `path` must be a string')
  }

  if (obj.type === 'regex' && !obj.value) {
    throw new Error('value must be defined for type: regex')
  }

  if (obj.type === 'enum' && !obj.values) {
    throw new Error('values must be defined for type: enum')
  }
}

const typeofs = {
  builtins: [ 'object'
            , 'boolean'
            , 'number'
            , 'string'
         // , 'function'  // you can't serialize a function
         // , 'symbol'    // no reason to support Symbol
         // , 'undefined' // no reason to support undefined
            ]
, custom: [ 'uuid'
          , 'date'  // although typeof new Date() === 'object'
          , 'regex' // although typeof new RegExp() === 'object'
          , 'email'
          , 'array' // although typeof Array() === 'object'
          , 'enum'
          ]
}

exports.typeofs = Object.assign({}, typeofs)

exports.isBuiltinType = function isBuiltinType(type) {
  return Boolean(~typeofs.builtins.indexOf(type))
}

exports.isCustomType = function isCustomType(type) {
  return Boolean(~typeofs.custom.indexOf(type))
}
