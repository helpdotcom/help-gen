'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath
const BINARY = Builder.ast.expression.BINARY

module.exports = class StringCheck extends Base {
  constructor(...args) {
    super(...args)
  }

  _getLessThanConditionalTest() {
    const left = OP(`${this.path}.length`)
    const right = Builder.number(this.prop.min)
    return BINARY(left, '<', right)
  }

  _getGreaterthanConditionalTest() {
    const left = OP(`${this.path}.length`)
    const right = Builder.number(this.prop.max)
    return BINARY(left, '>', right)
  }

  _getTooShortError() {
    return this.validator._getBuiltinRangeError(this, '<')
  }

  _getTooLongError() {
    return this.validator._getBuiltinRangeError(this, '>')
  }

  _applyRequiredToBuilder(b) {
    const prop = this.prop
    const test = this._getTypeof()
    const block = utils.callbackWithError(this._getError())

    const builder = Builder()

    if (typeof prop.min === 'number' && prop.min) {
      const block = utils.callbackWithError(this._getTooShortError())
      builder.if(this._getLessThanConditionalTest(), Builder.block(block))
    }

    if (typeof prop.max === 'number') {
      const block = utils.callbackWithError(this._getTooLongError())
      builder.if(this._getGreaterthanConditionalTest(), Builder.block(block))
    }

    if (prop.allowNull) {
      b.if(this._getIsNotNull(), Builder.block([
        Builder.if(test, Builder.block(block))
      , ...builder.build()
      ]))
    } else {
      b.if(test, Builder.block(block))
      b.push(...builder.build())
    }
  }

  _generateRequired() {
    this._applyRequiredToBuilder(this.builder)
  }

  _generateOptional() {
    const b = Builder()
    this._applyRequiredToBuilder(b)
    const has = this._getHasOwnProperty()
    if (has) {
      this.builder.if(this._getHasOwnProperty(), Builder.block(b.build()))
    } else {
      this.builder.push(...b.build())
    }
  }
}
