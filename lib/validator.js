'use strict'

const Builder = require('@helpdotcom/build-ast')
const utils = require('./utils')
const is = require('./is-helper')
const TYPES = require('./types')

const AST = Builder.ast
const S = AST.statement
const E = AST.expression
const getIsFunctionName = utils.getIsFunctionName
const assertType = utils.assertType

// Types
const ArrayType = require('./types/array')
const BaseType = require('./types/base')
const EnumType = require('./types/enum')
const NumberType = require('./types/number')
const ObjectType = require('./types/object')
const RegexType = require('./types/regex')
const StringType = require('./types/string')

module.exports = class Validator {
  constructor(options, file) {
    const opts = Object.assign({
      _prefix: 'obj'
    }, options)

    this.name = opts.name
    this.type = opts.type
    this.props = opts.props
    this.multi = opts.multi
    this.file = file

    this._prefix = 'obj'

    this.builder = Builder()

    if (this.multi) {
      this.prefix = `${this._prefix}.^__IDX__`
    } else {
      this.prefix = this._prefix
    }

    this._process()
  }

  _process() {
    let body = this.builder

    body.if(
      Builder.or(
        Builder.not(Builder.objectPath(this.prefix))
      , Builder.notEquals(
          Builder.typeof(this.prefix)
        , Builder.string('object')
        )
      )
    , Builder.block(utils.callbackWithError(
        Builder.TypeError(`(${this.type}): obj must be an object`)
      ))
    )

    for (const prop of this.props) {
      this.addCheck(prop, body)
    }

    if (this.multi) {
      const b = Builder()
      const idxVar = '__IDX__'
      const i = Builder.id(idxVar)
      b.push(this._topLevelArrayCheck())
      b.push(S.FOR(
        Builder.declare('var', idxVar, Builder.number(0))
      , E.BINARY(i, '<', Builder.objectPath('obj.length'))
      , E.UPDATE('++', i, false)
      , Builder.block(body.body)
      ))
      body = b
    }

    body.push(...utils.callbackSuccess([
      Builder.id('null')
    , Builder.id(this._prefix)
    ]))

    this.builder = body
  }

  addCheck(prop, builder = this.builder) {
    switch (prop.type) {
      case 'array':
        return this._addArrayCheck(prop, builder)
      case 'boolean':
      case 'date':
      case 'email':
      case 'uuid':
        return this._addBasicCheck(prop, builder)
      case 'enum':
        return this._addEnumCheck(prop, builder)
      case 'number':
        return this._addNumberCheck(prop, builder)
      case 'object':
        return this._addObjectCheck(prop, builder)
      case 'regex':
        return this._addRegexCheck(prop, builder)
      case 'string':
        return this._addStringCheck(prop, builder)
    }
  }

  build() {
    return this.builder.build()
  }

  reset() {
    this.builder = Builder()
  }

  // pragma: helper functions
  _wrap(a) {
    return `${this.prefix}.${a}`
  }

  _topLevelArrayCheck() {
    const em = `(${this.type}): obj must be an array`
    return Builder.ifNot(
      Builder.callFunction('Array.isArray', [
        Builder.id('obj')
      ])
    , Builder.block(utils.callbackWithError(Builder.TypeError(em)))
    )
  }

  _getHasOwnProperty(prop) {
    return utils.getHasForPath(this._wrap(prop.path))
  }

  _getPathIsNotNull(prop) {
    const path = this._wrap(prop.path)
    return Builder.notEquals(
      Builder.objectPath(path)
    , Builder.id('null')
    )
  }

  _getTypeof(prop) {
    switch (prop.type) {
      case 'array':
      case 'date':
      case 'email':
      case 'uuid':
        return this._getCustomTypeof(prop)
      default:
        return this._getPrimitiveTypeof(prop)
    }
  }

  _getPrimitiveTypeof(prop) {
    return Builder.notEquals(
      Builder.typeof(this._wrap(prop.path))
    , Builder.string(prop.type)
    )
  }

  _getCustomTypeof(prop) {
    const wrapped = this._wrap(prop.path)
    return Builder.not(is[getIsFunctionName(prop.type)](wrapped))
  }

  // pragma: Errors
  // Returns a basic TypeError for builtin types
  get _errorPrefix() {
    return `(${this.type}): Missing or invalid param:`
  }

  _getBuiltinTypeError(prop) {
    const type = prop.type
    const path = utils.cleanPath(prop.path)
    const msg = `${this._errorPrefix} "${path}". Expected ${type}, got `
    return Builder.TypeError(
      AST.templateLiteral([
        Builder.typeof(this._wrap(prop.path))
      ], [
        AST.templateElement(msg, msg, false)
      , AST.templateElement('', '', true)
      ])
    )
  }

  // Returns a basic TypeError for custom types
  _getCustomError(prop) {
    if (prop.type === 'enum') {
      return this._getEnumError(prop)
    }

    if (prop.type === 'regex') {
      return this._getRegexError(prop)
    }
    const type = prop.type
    const path = utils.cleanPath(prop.path)
    const msg = `${this._errorPrefix} "${path}". Expected ${type}`
    return Builder.TypeError(msg)
  }

  _getEnumError(prop) {
    assertType(prop, 'enum')
    const poss = prop.values.map((item) => {
      return JSON.stringify(item)
    }).join(', ')

    const path = utils.cleanPath(prop.path)
    const msg = `${this._errorPrefix} "${path}". Must be one of [${poss}]`
    return Builder.Error(msg)
  }

  _getRegexError(prop) {
    assertType(prop, 'regex')
    const path = utils.cleanPath(prop.path)
    const msg = `${this._errorPrefix} "${path}". Must match `
    return Builder.Error(
      AST.templateLiteral([Builder.id(prop._varName)], [
        AST.templateElement(msg, msg, false)
      , AST.templateElement('', '', true)
      ])
    )
  }

  // Returns a RangeError for strings where
  _getBuiltinRangeError(prop, op) {
    assertType(prop, TYPES.ALLOW_MIN_MAX)
    const prefix = this._errorPrefix
    const path = utils.cleanPath(prop.path)
    const l = op === '<'
      ? prop.min
      : prop.max

    const s = prop.type === 'string'
      ? 'Length'
      : 'Value'

    const memberExpression = prop.type === 'string'
      ? `${prop.path}.length`
      : prop.path

    const o = getOtherOp(op)
    const msg = `${prefix} "${path}". ${s} must be ${o}= ${l}, got `
    return Builder.RangeError(
      AST.templateLiteral([
        Builder.objectPath(this._wrap(memberExpression))
      ], [
        AST.templateElement(msg, msg, false)
      , AST.templateElement('', '', true)
      ])
    )
  }

  // pragma: Functions that actually add validations to the AST
  _addArrayCheck(prop, builder) {
    const obj = new ArrayType(prop, builder, this)
    obj.generate()
  }

  _addBasicCheck(prop, builder) {
    const obj = new BaseType(prop, builder, this)
    obj.generate()
  }

  _addEnumCheck(prop, builder) {
    const obj = new EnumType(prop, builder, this)
    obj.generate()
  }

  _addNumberCheck(prop, builder) {
    const obj = new NumberType(prop, builder, this)
    obj.generate()
  }

  _addObjectCheck(prop, builder) {
    const obj = new ObjectType(prop, builder, this)
    obj.generate()
  }

  _addRegexCheck(prop, builder) {
    const obj = new RegexType(prop, builder, this)
    obj.generate()
  }

  _addStringCheck(prop, builder) {
    const obj = new StringType(prop, builder, this)
    obj.generate()
  }
}

function getOtherOp(op) {
  if (op === '<') return '>'
  return '<'
}
