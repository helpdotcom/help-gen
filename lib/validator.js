'use strict'

const Builder = require('@helpdotcom/build-ast')
const Prop = require('@helpdotcom/nano-prop')
const utils = require('./utils')
const is = require('./is-helper')
const TYPES = require('./types')

const AST = Builder.ast
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
  constructor(opts, file) {
    this.name = opts.name
    this.type = opts.type
    this.file = file

    this.stripExtraneousProperties = opts.stripExtraneousProperties

    this.rootPath = 'obj'
    let root
    if (!opts.multi) {
      root = Prop.object().props(opts.props)
    } else {
      root = Prop.array().props(opts.props)
    }

    root.path(this.rootPath).required(true)
    this.root = root.toJSON()
  }

  resultVar() {
    return this.stripExtraneousProperties ? 'result' : this.rootPath
  }

  build() {
    const body = Builder()

    if (this.stripExtraneousProperties) {
      body.declare('let', this.resultVar())
    }

    const code = this.addCheck(this.root
                             , this.rootPath
                             , this.resultVar()
                             , this.rootPath)

    body.push(...code)

    body.push(...utils.callbackSuccess([
      Builder.id('null')
    , Builder.id(this.resultVar())
    ]))

    return body.build()
  }

  addCheck(prop, path, storeResultIn, displayPath) {
    const CheckClass = ({
      'array': ArrayType
    , 'boolean': BaseType
    , 'date': BaseType
    , 'email': BaseType
    , 'uuid': BaseType
    , 'enum': EnumType
    , 'number': NumberType
    , 'object': ObjectType
    , 'regex': RegexType
    , 'string': StringType
    })[prop.type]

    const check = new CheckClass(prop, path, this, storeResultIn, displayPath)
    return check.generate()
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
}

function getOtherOp(op) {
  if (op === '<') return '>'
  return '<'
}
