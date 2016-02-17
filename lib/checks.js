'use strict'

exports.checkValidation = function checkValidation(obj) {
  if (!obj.name) {
    throw new Error('Invalid rule. `name` is required')
  }

  if (typeof obj.name !== 'string') {
    throw new TypeError('Invalid rule. `name` must be a string')
  }

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
       // , 'array' // array will have to be special cased if we need that ever?
          ]
}

exports.isBuiltinType = function isBuiltinType(type) {
  return Boolean(~typeofs.builtins.indexOf(type))
}

exports.isCustomType = function isCustomType(type) {
  return Boolean(~typeofs.custom.indexOf(type))
}
