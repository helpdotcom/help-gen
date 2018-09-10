'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
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

  _getLengthNotEqualTest() {
    const left = OP(`${this.path}.length`)
    const right = Builder.number(this.prop.len)
    return BINARY(left, '!==', right)
  }

  _getTooShortError() {
    return this.validator._getBuiltinRangeError(this, '<')
  }

  _getTooLongError() {
    return this.validator._getBuiltinRangeError(this, '>')
  }

  _getLengthEqualityError() {
    return this.validator._getBuiltinRangeError(this, '=')
  }

  _generateRequired() {
    const prop = this.prop
    const test = this._getTypeof()
    const block = this._callbackWithError(this._getError())

    const builder = Builder()

    if (!prop.example) {
      this.warn('no string example', prop)
    }

    if (typeof prop.min === 'number') {
      const block = this._callbackWithError(this._getTooShortError())
      builder.if(this._getLessThanConditionalTest(), Builder.block(block))
    }

    if (typeof prop.max === 'number') {
      const block = this._callbackWithError(this._getTooLongError())
      builder.if(this._getGreaterthanConditionalTest(), Builder.block(block))
    } else {
      this.warn('no string max', prop)
    }

    if (typeof prop.len === 'number') {
      const block = this._callbackWithError(this._getLengthEqualityError())
      builder.if(this._getLengthNotEqualTest(), Builder.block(block))
    }

    if (prop.allowNull) {
      return Builder().if(this._getIsNotNull(), Builder.block([
        Builder.if(test, Builder.block(block))
      , ...builder.build()
      ])).build()
    } else {
      return Builder()
        .if(test, Builder.block(block))
        .push(...builder.build())
        .build()
    }
  }
}
