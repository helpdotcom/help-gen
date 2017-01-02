'use strict'

const Builder = require('@helpdotcom/build-ast')
const Prop = require('@helpdotcom/nano-prop')
const utils = require('./utils')
const is = require('./is-helper')
const TYPES = require('./types')

const AST = Builder.ast
const S = AST.statement
const getIsFunctionName = utils.getIsFunctionName
const assertType = utils.assertType

const { getCheck } = require('./types/')

module.exports = class Validator {
  constructor(opts, file) {
    this.name = opts.name
    this.type = opts.type
    this.file = file

    this.stripExtraneousProperties = opts.stripExtraneousProperties
    this.failOnExtraneousProperties = opts.failOnExtraneousProperties

    this.synchronousReturn = opts.synchronousReturn

    this._resultVar = undefined
    if (opts.resultVar) {
      this._resultVar = opts.resultVar

      // Storing the result in another variable implies that unexpected
      // properties will not be copied.
      this.stripExtraneousProperties = true
    }

    if (opts.performDeepClone === undefined) {
      this.performDeepClone = this.stripExtraneousProperties
    } else {
      this.performDeepClone = opts.performDeepClone
    }

    this.useObjectAssignForRoot = opts.useObjectAssignForRoot || false

    if (this.stripExtraneousProperties && this.failOnExtraneousProperties) {
      throw new Error('Stripping and failing on extraneous properties are ' +
                      'mutually exclusive')
    }

    this.rootPath = opts.inputVar
    let root
    if (!opts.multi) {
      root = Prop.object().props(utils.deepClone(opts.props))
    } else {
      root = Prop.array().props(utils.deepClone(opts.props))
    }

    root.path(this.rootPath).required(true)
    this.root = root.toJSON()
  }

  resultVar() {
    if (this._resultVar !== undefined) {
      return this._resultVar
    }

    return this.stripExtraneousProperties ? 'result' : this.rootPath
  }

  getRootCheck() {
    return getCheck({
      prop: this.root
    , path: this.rootPath
    , storeResultIn: this.resultVar()
    , displayPath: this.rootPath
    , validator: this
    })
  }

  buildRaw() {
    return this.getRootCheck().generate()
  }

  build(rawBody) {
    const body = Builder()

    if (this.stripExtraneousProperties) {
      body.declare('let', this.resultVar())
    }

    body.push(...rawBody)

    body.push(...this._callbackSuccess(
      Builder.id(this.resultVar())
    ))

    return body.build()
  }

  _getPathIsNotNull(path) {
    return Builder.notEquals(
      Builder.objectPath(path)
    , Builder.id('null')
    )
  }

  _getTypeof(path, type) {
    switch (type) {
      case 'array':
      case 'date':
      case 'email':
      case 'uuid':
        return this._getCustomTypeof(path, type)
      default:
        return this._getPrimitiveTypeof(path, type)
    }
  }

  _getPrimitiveTypeof(path, type) {
    return Builder.notEquals(
      Builder.typeof(path)
    , Builder.string(type)
    )
  }

  _getCustomTypeof(path, type) {
    return Builder.not(is[getIsFunctionName(type)](path))
  }

  // pragma: Errors
  get _errorPrefix() {
    return `(${this.type}): Missing or invalid param:`
  }

  // Returns a basic TypeError for builtin types
  _getBuiltinTypeError(check) {
    const type = check.prop.type
    const displayPath = check.displayPath
    const msg = `${this._errorPrefix} "${displayPath}". Expected ${type}, got `
    return Builder.TypeError(
      AST.templateLiteral([
        Builder.typeof(check.path)
      ], [
        AST.templateElement(msg, msg, false)
      , AST.templateElement('', '', true)
      ])
    )
  }

  // Returns a basic TypeError for custom types
  _getCustomError(check) {
    const type = check.prop.type
    const displayPath = check.displayPath
    if (type === 'enum') {
      return this._getEnumError(check)
    }

    if (type === 'regex') {
      return this._getRegexError(check)
    }
    const msg = `${this._errorPrefix} "${displayPath}". Expected ${type}`
    return Builder.TypeError(msg)
  }

  _getEnumError(check) {
    assertType(check.prop, 'enum')
    const displayPath = check.displayPath
    const poss = check.prop.values.map(JSON.stringify).join(', ')

    const msg = `${this._errorPrefix} "${displayPath}". ` +
                `Must be one of [${poss}]`
    return Builder.Error(msg)
  }

  _getRegexError(check) {
    assertType(check.prop, 'regex')
    const displayPath = check.displayPath
    const msg = `${this._errorPrefix} "${displayPath}". Must match `
    return Builder.Error(
      AST.templateLiteral([Builder.id(check._varName)], [
        AST.templateElement(msg, msg, false)
      , AST.templateElement('', '', true)
      ])
    )
  }

  // Returns a RangeError for strings where
  _getBuiltinRangeError(check, op) {
    const prefix = this._errorPrefix
    const prop = check.prop
    assertType(prop, TYPES.ALLOW_MIN_MAX)

    const displayPath = check.displayPath
    const l = op === '<'
      ? prop.min
      : prop.max

    const s = prop.type === 'string'
      ? 'Length'
      : 'Value'

    const memberExpression = prop.type === 'string'
      ? `${check.path}.length`
      : check.path

    const o = getOtherOp(op)
    const msg = `${prefix} "${displayPath}". ${s} must be ${o}= ${l}, got `
    return Builder.RangeError(
      AST.templateLiteral([
        Builder.objectPath(memberExpression)
      ], [
        AST.templateElement(msg, msg, false)
      , AST.templateElement('', '', true)
      ])
    )
  }

  _callbackWithError(err) {
    const b = Builder()
      .declare('const', 'er', err)
      .assign('er.code', Builder.string('EINVAL'))

    if (this.synchronousReturn) {
      return b.throws(Builder.id('er')).build()
    }

    return b
      .push(S.EXPRESSION(
        Builder.callFunction('setImmediate', [
          Builder.id('cb')
        , Builder.id('er')
        ])
      ))
      .returns(AST.literal(false))
      .build()
  }

  _callbackSuccess(returnValue) {
    if (this.synchronousReturn) {
      return Builder().returns(returnValue).build()
    }

    return Builder()
      .push(S.EXPRESSION(
        Builder.callFunction('setImmediate', [
          Builder.id('cb')
        , Builder.id('null')
        , returnValue
        ])
      ))
      .returns(AST.literal(true))
      .build()
  }
}

function getOtherOp(op) {
  if (op === '<') return '>'
  return '<'
}
