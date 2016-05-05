'use strict'

// This file is a set of utilities for generating AST nodes
const checks = require('./checks')
const assert = require('assert')

// generates a literal regex
// like /abc/
exports.regex = function regex(value, raw, pattern, flags) {
  return {
    type: 'Literal'
  , value: value
  , raw: raw
  , regex: {
      pattern: pattern
    , flags: flags
    }
  }
}

// generates a literal value
// exports.literal('obj', `'obj'`) => _'obj'_
exports.literal = function literal(value, raw) {
  if (arguments.length === 2) {
    return {
      type: 'Literal'
    , value: value
    , raw: raw
    }
  }

  return {
    type: 'Literal'
  , value: value
  }
}

// items should already be transformed into ast nodes
exports.array = function array(items) {
  return {
    type: 'ArrayExpression'
  , elements: items
  }
}

// an identifier represents something that is identified by a name
// like a variable.
// exports.identifier('obj') => _obj_
exports.identifier = function identifier(name) {
  return {
    type: 'Identifier'
  , name: name
  }
}

// creates a member expression with _this_ as the object
// exports.thisExpression('test') => _this.test_
exports.thisExpression = function thisExpression(varName) {
  return exports.memberExpression({
    type: 'ThisExpression'
  }, exports.identifier(varName), false)
}

// creates a unary expression. _op_ is the operator (like !)
// arg is the arg to check against
exports.unaryExpression = function unaryExpression(op, arg) {
  return {
    type: 'UnaryExpression'
  , operator: op
  , prefix: true
  , argument: arg
  }
}

exports.binaryExpression = function binaryExpression(op, left, right) {
  return {
    type: 'BinaryExpression'
  , left: left
  , operator: op
  , right: right
  }
}

exports.updateExpression = function updateExpression(op, arg, pre) {
  return {
    type: 'UpdateExpression'
  , operator: op
  , prefix: pre || false
  , argument: arg
  }
}

exports.logicalOr = function logicalOr(left, right) {
  return {
    type: 'LogicalExpression'
  , left: left
  , operator: '||'
  , right: right
  }
}

// this[left] = right
exports.expressionStatement = function expressionStatement(left, right) {
  return {
    type: 'ExpressionStatement'
  , expression: {
      type: 'AssignmentExpression'
    , operator: '='
    , left: left
    , right: right
    }
  }
}

exports.memberExpression = function memberExpression(obj, prop, computed) {
  return {
    type: 'MemberExpression'
  , object: obj
  , property: prop
  , computed: computed
  }
}

// A MemberExpression represents an object lookup
// This function returns the configuration necessary for creating
// a MemberExpression node of the AST.
exports.objectPath = function objectPath(str, skipObj) {
  // Split on periods. A period represents a lookup
  const splits = str.split('.')

  // `obj` is our top level object that is passed into the validator.
  if (!skipObj)
    splits.unshift('obj')

  const prop = splits.pop()
  const out = exports.memberExpression(null, null, false)

  if (exports.varNeedsBrackets(prop)) {
    out.computed = true
    out.property = exports.literal(prop, `'${prop}'`)
  } else {
    out.property = exports.identifier(prop)
  }


  // If splits.length === 1, then we do not have to nest another
  // MemberExpression, we simply set the object to be an Identifier node
  if (splits.length === 1) {
    const s = splits.pop()
    out.object = exports.identifier(s)
  } else {
    out.object = exports.objectPath(splits.join('.'), true)
  }

  return out
}

exports.error = function error(msg, type) {
  type = type || 'Error'
  return exports.newExpression(type, [exports.literal(msg, `'${msg}'`)])
}

exports.newExpression = function newExpression(callee, args) {
  const out = {
    type: 'NewExpression'
  , callee: callee
  , arguments: args
  }
  if (typeof callee === 'string') {
    out.callee = exports.identifier(callee)
  }
  return out
}

exports.errorTemplate = function errorTemplate(msg, type, v) {
  const exprs = [exports.identifier(v)]
  const eles = [
    exports.templateElement(msg, msg, false)
  , exports.templateElement('', '', true)
  ]

  const str = exports.templateLiteral(exprs, eles)
  type = type || 'Error'
  return exports.newExpression(type, [str])
}

exports.cbWithArgs = function cbWithArgs(args) {
  return {
    type: 'ExpressionStatement'
  , expression: exports.callExpression('cb', args)
  }
}

exports.cbWithError = function cbWithError(msg, type, v) {
  const o = v
    ? exports.errorTemplate(msg, type, v)
    : exports.error(msg, type)
  return exports.cbWithArgs([
    o
  ])
}

exports.cbWithObject = function cbWithObject() {
  return exports.cbWithArgs([
    exports.literal(null, '\'null\'')
  , exports.identifier('obj')
  ])
}

exports.forStatement = function forStatement(init, test, update, body) {
  return {
    type: 'ForStatement'
  , init: init
  , test: test
  , update: update
  , body: exports.blockStatement(body || [])
  }
}

exports.blockStatement = function blockStatement(block) {
  return {
    type: 'BlockStatement'
  , body: block
  }
}

exports.callCallback = function callCallback(body) {
  return {
    type: 'ReturnStatement'
  , argument: {
      type: 'CallExpression'
    , callee: exports.identifier('setImmediate')
    , arguments: [
        {
          type: 'ArrowFunctionExpression'
        , id: null
        , generator: false
        , expression: false
        , params: []
        , body: {
            type: 'BlockStatement'
          , body: body
          }
        }
      ]
    }
  }
}

exports.returnError = function returnError(message, type, v) {
  type = type || 'Error'
  return exports.callCallback([
    exports.cbWithError(message, type, v)
  ])
}

exports.returnCB = function returnCB() {
  return exports.callCallback([
    exports.cbWithObject()
  ])
}

// obj, obj.room.id
exports.notExpression = function notExpression(path, skipObj) {
  return {
    type: 'UnaryExpression'
  , operator: '!'
  , prefix: true
  , argument: exports.objectPath(path, skipObj)
  }
}

exports.valRegexCheck = function valRegexCheck(varName, path) {
  const callee = exports.objectPath(`${varName}.test`, true)
  const args = [
    // this will hold the property
    // ex: obj.email
    exports.objectPath(path)
  ]
  const test = exports.callExpression(callee, args)
  const consequent = exports.blockStatement([
    exports.returnError(`Path "${path}" must match `, null, varName)
  ])
  return exports.ifNot(test, consequent)
}

exports.ifOr = function ifOr(left, right, block) {
  return {
    type: 'IfStatement'
  , test: {
      type: 'LogicalExpression'
    , left: left
    , operator: '||'
    , right: right
    }
  , consequent: block
  }
}

exports.callExpression = function callExpression(name, args) {
  return {
    type: 'CallExpression'
  , callee: typeof name === 'string' ? exports.identifier(name) : name
  , arguments: args
  }
}

const fnNames = {
  uuid: 'isv4UUID'
, date: 'isDate'
, email: 'isEmail'
, array: 'Array.isArray'
}

function getFunctionName(type) {
  assert(fnNames.hasOwnProperty(type))
  return fnNames[type]
}

exports.ifNot = function ifNot(arg, consequent) {
  const test = exports.unaryExpression('!', arg)

  return {
    type: 'IfStatement'
  , test: test
  , consequent: consequent
  }
}

// typeof check for custom type for responses
exports.resCustomTypeofCheck = function resCustomTypeofCheck(path, er, type) {
  let args = [
    exports.objectPath(path, true)
  ]

  let block = exports.getInvalidBlocks(exports.literal(er))

  return exports.customTypeofCheck(args, type, block)
}

// typeof check for custom type for validators
exports.valCustomTypeofCheck = function valCustomTypeofCheck(path, er, type) {
  let args = [
    exports.objectPath(path)
  ]

  let block = exports.blockStatement([
    exports.returnError(er, 'TypeError')
  ])

  return exports.customTypeofCheck(args, type, block)
}

exports.customTypeofCheck = function customTypeofCheck(args, type, block) {
  const arg = exports.callExpression(getFunctionName(type), args)
  return exports.ifNot(arg, block)
}

exports.resObjectTypeofCheck = function resObjectTypeofCheck(opts) {
  const e = exports.identifier(opts.varName)
  // have to check for null as well as typeof
  const left = exports.notExpression(opts.path, true)

  const right = exports.binaryExpression(
    '!=='
  , e
  , exports.literal(opts.type)
  )

  assert(opts.varName, 'varName should be present. This is a bug')
  const exprs = [exports.identifier(opts.varName)]
  const eles = [
    exports.templateElement(opts.err, opts.err, false)
  , exports.templateElement('', '', true)
  ]
  const block = exports.getInvalidBlocks(exports.templateLiteral(exprs, eles))

  return exports.ifOr(left, right, block)
}

exports.valObjectTypeofCheck = function valObjectTypeofCheck(opts) {
  const e = exports.identifier(opts.varName)
  let block = exports.blockStatement([
    exports.returnError(opts.err, 'TypeError', opts.varName)
  ])

  // have to check for null as well as typeof
  const left = exports.notExpression(opts.path)
  const right = exports.binaryExpression(
    '!=='
  , e
  , exports.literal(opts.type)
  )

  return exports.ifOr(left, right, block)
}

// name is should be the config.name, varName represents the name
// of the variable to which the typeof check is assigned
// used for responses
exports.resTypeofCheck = function resTypeofCheck(name, type, path, varName) {
  let err = `property "${path}" is invalid. Expected type "${type}"`
  if (varName) {
    err += ', got '
  }

  path = `this.${path}`

  if (checks.isCustomType(type)) {
    return exports.resCustomTypeofCheck(path, err, type)
  }

  assert(varName, 'varName should be present. This is a bug.')

  if (type === 'object') {
    return exports.resObjectTypeofCheck({
      path: path
    , type: type
    , varName: varName
    , err: err
    })
  }

  const e = exports.identifier(varName)
  const exprs = [e]
  const eles = [
    exports.templateElement(err, err, false)
  , exports.templateElement('', '', true)
  ]

  const block = exports.getInvalidBlocks(
    exports.templateLiteral(exprs, eles)
  )

  const test = exports.binaryExpression('!==', e, exports.literal(type))
  return {
    type: 'IfStatement'
  , test: test
  , consequent: block
  }
}

// name is should be the config.name, varName represents the name
// of the variable to which the typeof check is assigned
exports.valTypeofCheck = function valTypeofCheck(name, type, path, varName) {
  let err = `Missing or invalid required param (${path}) for name ${name}.`
  if (varName) {
    err += ` Expected ${type}, got `
  } else {
    err += ` Expected ${type}`
  }

  if (checks.isCustomType(type)) {
    return exports.valCustomTypeofCheck(path, err, type)
  }

  assert(varName, 'varName should be defined. This is a bug.')

  if (type === 'object') {
    return exports.valObjectTypeofCheck({
      path: path
    , err: err
    , varName: varName
    , type: type
    })
  }

  // it is a primitive at this point
  const block = exports.blockStatement([
    exports.returnError(err, 'TypeError', varName)
  ])

  const test = exports.binaryExpression(
    '!=='
  , exports.identifier(varName)
  , exports.literal(type)
  )

  return {
    type: 'IfStatement'
  , test: test
  , consequent: block
  }
}

exports.typeofExpression = function typeofExpression(arg) {
  return {
    type: 'UnaryExpression'
  , operator: 'typeof'
  , prefix: true
  , argument: arg
  }
}

exports.declareVar = function declareVar(name, init, type) {
  type = type || 'const'
  return {
    type: 'VariableDeclaration'
  , declarations: [
      { type: 'VariableDeclarator'
      , id: exports.identifier(name)
      , init: init
      }
    ]
  , kind: type
  }
}

exports.declareFn = function declareFn(name, args) {
  args = args || []
  return {
    type: 'FunctionDeclaration'
  , generator: false
  , expression: false
  , id: exports.identifier(name)
  , params: args.map((item) => {
      if (typeof item === 'object') {
        return item
      }

      return exports.identifier(item)
    })
  , body: exports.blockStatement([])
  }
}

exports.templateElement = function templateElement(raw, cooked, tail) {
  return {
    type: 'TemplateElement'
  , value: {
      raw: raw
    , cooked: cooked
    }
  , tail: tail
  }
}

exports.templateLiteral = function templateLiteral(exprs, quasis) {
  return {
    type: 'TemplateLiteral'
  , expressions: exprs
  , quasis: quasis
  }
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

exports.returnStatement = function returnStatement(arg) {
  return {
    type: 'ReturnStatement'
  , argument: arg
  }
}

exports.returnOut = function returnOut() {
  return exports.returnStatement(exports.identifier('out'))
}

exports.getInvalidBlocks = function getInvalidBlocks(msg) {
  const invalid = exports.expressionStatement(
    exports.objectPath('out.valid', true)
  , exports.literal(false, 'false')
  )

  const m = exports.expressionStatement(
    exports.objectPath('out.msg', true)
  , msg
  )

  return exports.blockStatement([
    invalid
  , m
  , exports.returnOut()
  ])
}

// thanks eslint
const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

exports.varNeedsBrackets = function varNeedsBrackets(varName) {
  return !validIdentifier.test(varName)
}
