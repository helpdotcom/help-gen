'use strict'

const checks = require('./checks')

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

exports.identifier = function identifier(name) {
  return {
    type: 'Identifier'
  , name: name
  }
}

exports.thisExpression = function thisExpression(varName) {
  return {
    type: 'MemberExpression'
  , object: {
      type: 'ThisExpression'
    }
  , property: exports.identifier(varName)
  , computed: false
  }
}

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

// A MemberExpression represents an object lookup
// This function returns the configuration necessary for creating
// a MemberExpression node of the AST.
exports.memberExpression = function memberExpression(str, skipObj) {
  // Split on periods. A period represents a lookup
  const splits = str.split('.')

  // `obj` is our top level object that is passed into the validator.
  if (!skipObj)
    splits.unshift('obj')

  const prop = splits.pop()
  const out = {
    type: 'MemberExpression'
  , object: null
  , property: null
  , computed: false
  }

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
    out.object = exports.memberExpression(splits.join('.'), true)
  }

  return out
}

exports.error = function error(msg, type) {
  type = type || 'Error'
  return {
    type: 'NewExpression'
  , callee: exports.identifier(type)
  , arguments: [
      exports.literal(msg, `'${msg}'`)
    ]
  }
}

exports.errorTemplate = function errorTemplate(msg, type, v) {
  const exprs = [exports.identifier(v)]
  const eles = [
    exports.templateElement(msg, msg, false)
  , exports.templateElement('', '', true)
  ]

  const str = exports.templateLiteral(exprs, eles)
  type = type || 'Error'
  return {
    type: 'NewExpression'
  , callee: exports.identifier(type)
  , arguments: [
      str
    ]
  }
}

exports.cbWithArgs = function cbWithArgs(args) {
  return {
    type: 'ExpressionStatement'
  , expression: {
      type: 'CallExpression'
    , callee: exports.identifier('cb')
    , arguments: args
    }
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
    exports.literal(null, `'null'`)
  , exports.identifier('obj')
  ])
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
  , argument: exports.memberExpression(path, skipObj)
  }
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
  , callee: exports.identifier(name)
  , arguments: args
  }
}

function getFunctionName(type) {
  switch (type) {
    case 'uuid':
      return 'isv4UUID'
    case 'date':
      return 'isDate'
    default:
      throw new Error(`Invalid type ${type}`)
  }
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
    exports.memberExpression(path, true)
  ]

  let block = exports.getInvalidBlocks(exports.literal(er))

  return exports.customTypeofCheck(args, type, block)
}

// typeof check for custom type for validators
exports.valCustomTypeofCheck = function valCustomTypeofCheck(path, er, type) {
  let args = [
    exports.memberExpression(path)
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
  const e = exports.memberExpression(opts.path, true)
  // have to check for null as well as typeof
  const left = exports.notExpression(opts.path, true)

  const right = exports.binaryExpression(
    '!=='
  , exports.typeofExpression(e)
  , exports.literal(opts.type)
  )

  let block
  if (opts.varName) {
    const exprs = [exports.identifier(opts.varName)]
    const eles = [
      exports.templateElement(opts.err, opts.err, false)
    , exports.templateElement('', '', true)
    ]
    block = exports.getInvalidBlocks(exports.templateLiteral(exprs, eles))
  } else {
    block = exports.getInvalidBlocks(exports.identifier(opts.err))
  }

  return exports.ifOr(left, right, block)
}

exports.valObjectTypeofCheck = function valObjectTypeofCheck(opts) {
  const e = exports.memberExpression(opts.path)
  let block = exports.blockStatement([
    exports.returnError(opts.err, 'TypeError', opts.varName)
  ])

  // have to check for null as well as typeof
  const left = exports.notExpression(opts.path)
  const right = exports.binaryExpression(
    '!=='
  , exports.typeofExpression(e)
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

  if (type === 'object') {
    return exports.resObjectTypeofCheck({
      path: path
    , type: type
    , varName: varName
    , err: err
    })
  }

  const e = exports.memberExpression(path, true)
  let block
  if (varName) {
    const exprs = [exports.identifier(varName)]
    const eles = [
      exports.templateElement(err, err, false)
    , exports.templateElement('', '', true)
    ]

    block = exports.getInvalidBlocks(
      exports.templateLiteral(exprs, eles)
    )
  } else {
    block = exports.getInvalidBlocks(exports.literal(err))
  }

  const test = exports.binaryExpression(
    '!=='
  , exports.typeofExpression(e)
  , exports.literal(type)
  )
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

  if (type === 'object') {
    return exports.valObjectTypeofCheck({
      path: path
    , err: err
    , varName: varName
    , type: type
    })
  }

  // it is a primitive at this point
  const e = exports.memberExpression(path)
  const block = exports.blockStatement([
    exports.returnError(err, 'TypeError', varName)
  ])

  const test = exports.binaryExpression(
    '!=='
  , exports.typeofExpression(e)
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

let currentVar = 0
exports.nextVar = function nextVar() {
  return `___${currentVar++}`
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
    exports.memberExpression('out.valid', true)
  , exports.literal(false, 'false')
  )

  const m = exports.expressionStatement(
    exports.memberExpression('out.msg', true)
  , msg
  )

  return exports.blockStatement([
    invalid
  , m
  , exports.returnOut()
  ])
}

exports.varNeedsBrackets = function varNeedsBrackets(varName) {
  if (~varName.indexOf('-'))
    return true

  const firstChar = varName.charCodeAt(0)
  // 36 $
  // 95 _
  if (firstChar !== 36 && firstChar !== 95) {
    // the first character of a variable can be $, _ of a letter
    if (!charIsChar(firstChar)) return true
  }

  for (var i = 0; i < varName.length; i++) {
    if (!charIsValid(varName[i].charCodeAt(0))) return true
  }

  return false
}

function charIsChar(str) {
  const c = str
  if (c < 65) return false
  if (c > 64 && c < 91) return true
  if (c > 95 && c < 123) return true
  return false
}

// for all but the first character
function charIsValid(str) {
  if (charIsChar(str))
    return true

  const c = str
  // 49 -> 1
  // 57 -> 9
  return c > 48 && c < 58
}

exports.genOpts = {
  format: {
    indent: {
      style: '  '
    , base: 0
    , adjustMultilineComment: false
    }
  , space: ' '
  , json: false
  , quotes: 'single'
  , semicolons: false
  , compact: false
  }
}
