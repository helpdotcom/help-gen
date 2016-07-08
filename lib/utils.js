'use strict'

const parse = require('acorn').parse

exports.parseJS = function parseJS(str) {
  return parse(str, {
    ecmaVersion: 6
  })
}

exports.objectExpression = function objectExpression(props) {
  return {
    type: 'ObjectExpression'
  , properties: props
  }
}

exports.property = function property(key, val, kind) {
  kind = kind || 'init'
  return {
    type: 'Property'
  , method: false
  , shorthand: false
  , computed: false
  , key: key
  , value: val
  , kind: kind
  }
}

// thanks eslint
const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

exports.varNeedsBrackets = function varNeedsBrackets(varName) {
  return !validIdentifier.test(varName)
}
