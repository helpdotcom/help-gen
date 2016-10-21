'use strict'

const assert = require('assert')
const util = require('util')
const Prop = require('@helpdotcom/nano-prop')
const Builder = require('@helpdotcom/build-ast')
const AST = Builder.ast
const S = AST.statement
const E = AST.expression

// thanks eslint
const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

exports.isValidIdentifier = function isValidIdentifier(s) {
  return validIdentifier.test(s)
}

exports.declareHas = function declareHas() {
  const callHas = Builder.callFunction(
    'Object.prototype.hasOwnProperty.call'
  , [Builder.id('obj'), Builder.id('prop')]
  )

  return Builder.declare('const', 'has', E.ARROW([
    Builder.id('obj')
  , Builder.id('prop')
  ], Builder.block(Builder.returns(callHas))))
}

exports.getHasForPath = function getHasForPath(path) {
  const p = exports.maybeStripLoopVar(path)
  if (p !== path) return null
  const splits = p.split('.')
  const right = Builder.string(splits.pop())
  const left = Builder.objectPath(splits.join('.'))
  return Builder.callFunction('has', [left, right])
}

const ERROR_PARTS_RE = /\.(\^__IDX__[\d]*)/g
const REPLACEMENT_CODE_START = 'i'.charCodeAt(0)
function getVarReplacement(str) {
  const match = str.match(PART_MATCH_RE)
  if (!match) return ''
  const d = +match[1]
  return '[' + String.fromCharCode(REPLACEMENT_CODE_START + d - 1) + ']'
}

exports.cleanPath = function cleanPath(p) {
  return p.replace(ERROR_PARTS_RE, getVarReplacement)
}

const NAMES_FOR_TYPES = new Map([
  ['date', 'isDate']
, ['email', 'isEmail']
, ['uuid', 'isUUID']
, ['array', 'isArray']
])

exports.getIsFunctionName = function getIsFunctionName(type) {
  if (NAMES_FOR_TYPES.has(type)) {
    return NAMES_FOR_TYPES.get(type)
  }

  throw new Error(`Invalid type: "${type}"`)
}

exports.callbackWithError = function callbackWithError(err) {
  return Builder()
    .declare('const', 'er', err)
    .assign('er.code', Builder.string('EINVAL'))
    .push(S.EXPRESSION(
      Builder.callFunction('setImmediate', [
        Builder.id('cb')
      , Builder.id('er')
      ])
    ))
    .returns(AST.literal(false))
    .build()
}

exports.callbackSuccess = function callbackSuccess(arg) {
  const args = arg
    ? (Array.isArray(arg) ? arg : [arg])
    : []

  args.unshift(Builder.id('cb'))

  return Builder()
    .push(S.EXPRESSION(
      Builder.callFunction('setImmediate', args)
    ))
    .returns(AST.literal(true))
    .build()
}

exports.assertSingleType = assertSingleType

function assertSingleType(item, type) {
  const t = item.type
  assert(t === type, `THIS IS A BUG. PROP MUST BE A ${type}, GOT ${t}`)
}

exports.assertOneOfType = assertOneOfType

function assertOneOfType(item, types) {
  const t = item.type
  const ts = util.inspect(types)
  assert(types instanceof Set, 'types must be a Set')
  if (types instanceof Set) {
    assert(types.has(t), `THIS IS A BUG. PROP MUST BE ONE OF ${ts}, GOT ${t}`)
  }
}

exports.assertType = assertType

function assertType(item, types) {
  if (typeof types === 'string') {
    return assertSingleType(item, types)
  }

  assertOneOfType(item, types)
}

exports.isObjectPath = function isObjectPath(path) {
  if (typeof path !== 'string') return false
  const out = path.indexOf('.') !== -1
  return out
}

exports.getParentPath = function getParentPath(path) {
  if (!exports.isObjectPath(path)) return null
  const splits = path.split('.')
  splits.pop()
  return splits.join('.')
}

exports.propSort = function propSort(a, b) {
  return a.path < b.path
    ? -1
    : a.path > b.path
    ? 1
    : 0
}

exports.propToJSON = function propToJSON(p) {
  const prop = Prop.isProp(p)
    ? p.toJSON()
    : p

  prop.children = Array.isArray(prop.children)
    ? prop.children
    : []

  if (prop.props) {
    if (Array.isArray(prop.props)) {
      prop.props = prop.props.map(exports.propToJSON)
    } else {
      prop.props = exports.propToJSON(prop.props)
    }
  }

  return prop
}

const PART_MATCH_RE = /\^__IDX__([\d]+)/

exports.getLoopVar = function getLoopVar(path) {
  const idx = exports.getLoopIndex(path)
  return `^__IDX__${idx}`
}

exports.getLoopIndex = function getLoopIndex(path) {
  if (!exports.isObjectPath(path)) return 1
  const splits = path.split('.')
  var len = splits.length
  while (len--) {
    const part = splits[len]
    const match = part.match(PART_MATCH_RE)
    if (match) {
      const idx = +match[1] + 1
      return idx
    }
  }

  return 1
}

exports.maybeStripLoopVar = function maybeStripLoopVar(path) {
  if (!exports.isObjectPath(path)) return path
  const splits = path.split('.')
  const last = splits.pop()
  if (PART_MATCH_RE.test(last)) {
    return splits.join('.')
  }

  return path
}

function wrapDisableEslint(str) {
  return `/* eslint-disable */\n\n${str}`
}

exports.fixup = function fixup(str) {
  return wrapDisableEslint(str
    .replace('\'use strict\';', '\'use strict\'\n')
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/\];$/gm, ']')
    .replace(/;$/gm, '')
  )
}
