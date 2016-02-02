'use strict'

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

exports.logicalOr = function logicalOr(left, right) {
  return {
    type: 'LogicalExpression'
  , left: left
  , operator: '||'
  , right: right
  }
}

// this[left] = right
exports.thisAssignment = function thisAssignment(left, right) {
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
  , property: exports.literal(prop, `'${prop}'`)
  , computed: true
  }

  // If splits.length === 1, then we do not have to nest another
  // MemberExpression, we simply set the object to be an Identifier node
  if (splits.length === 1) {
    out.object = exports.identifier(splits.pop())
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
exports.notExpression = function notExpression(path) {
  return {
    type: 'UnaryExpression'
  , operator: '!'
  , prefix: true
  , argument: exports.memberExpression(path)
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

exports.typeofCheck = function typeofCheck(name, type, path, vName) {
  let err = `Missing or invalid required param (${path}) for name ${name}.`
  err += ` Expected ${type}, got `
  const e = exports.memberExpression(path)

  const block = exports.blockStatement([
    exports.returnError(err, 'TypeError', vName)
  ])

  if (type === 'object') {
    // have to check for null as well as typeof
    const left = exports.notExpression(path)
    const right = {
      type: 'BinaryExpression'
    , left: exports.typeofExpression(e)
    , operator: '!=='
    , right: exports.literal(type)
    }

    return exports.ifOr(left, right, block)
  } else {
    return {
      type: 'IfStatement'
    , test: {
        type: 'BinaryExpression'
      , left: exports.typeofExpression(e)
      , operator: '!=='
      , right: exports.literal(type)
      }
    , consequent: block
    }
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
