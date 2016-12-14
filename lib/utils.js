'use strict'

const assert = require('assert')
const util = require('util')
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

exports.callbackSuccess = function callbackSuccess(args) {
  if (!args || !Array.isArray(args)) {
    throw new Error('"args" must be an array of arguments')
  }

  args.unshift(Builder.id('cb'))

  return Builder()
    .push(S.EXPRESSION(
      Builder.callFunction('setImmediate', args)
    ))
    .returns(AST.literal(true))
    .build()
}

function assertSingleType(item, type) {
  const t = item.type
  assert(t === type, `THIS IS A BUG. PROP MUST BE A ${type}, GOT ${t}`)
}

function assertOneOfType(item, types) {
  const t = item.type
  const ts = util.inspect(types)
  assert(types instanceof Set, 'types must be a Set')
  assert(types.has(t), `THIS IS A BUG. PROP MUST BE ONE OF ${ts}, GOT ${t}`)
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
  return path.includes('.')
}

exports.propSort = function propSort(a, b) {
  return a.path < b.path
    ? -1
    : a.path > b.path
    ? 1
    : 0
}

const PART_MATCH_RE = /\^__IDX__([\d]+)/

exports.maybeStripLoopVar = function maybeStripLoopVar(path) {
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

exports.deepClone = function deepClone(obj, memos = new Map()) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (memos.has(obj))
    return memos.get(obj)

  if (Array.isArray(obj))
    return obj.map((e) => { return deepClone(e, memos) })

  if (Object.prototype.toString.call(obj) === '[object RegExp]')
    return obj

  const copy = Object.create(Object.getPrototypeOf(obj))
  memos.set(obj, copy)

  Object.getOwnPropertyNames(obj).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key)

    if (descriptor.hasOwnProperty('value')) {
      descriptor.value = deepClone(descriptor.value, memos)
    }

    Object.defineProperty(copy, key, descriptor)
  })

  return copy
}
