'use strict'

const Builder = require('@helpdotcom/build-ast')
const utils = require('../utils')
const TYPES = require('../types')

module.exports = class BaseCheck {
  constructor(prop, builder, validator) {
    this.prop = prop
    this.builder = builder
    this.validator = validator
    this.path = prop.path
    this._cleanPath = utils.cleanPath(this.path)
  }

  generate() {
    if (this.prop.required) {
      return this._generateRequired()
    }

    return this._generateOptional()
  }

  _getTypeof() {
    return this.validator._getTypeof(this.prop)
  }

  _getIsNotNull() {
    return this.validator._getPathIsNotNull(this.prop)
  }

  _getError() {
    if (TYPES.BUILTINS.has(this.prop.type)) {
      return this.validator._getBuiltinTypeError(this.prop)
    }

    return this.validator._getCustomError(this.prop)
  }

  _getHasOwnProperty() {
    return this.validator._getHasOwnProperty(this.prop)
  }

  _getConditionalTest() {
    if (this.prop.allowNull) {
      return Builder.and(this._getIsNotNull(), this._getTypeof())
    }

    return this._getTypeof()
  }


  _generateRequired() {
    const test = this._getConditionalTest()
    const block = utils.callbackWithError(this._getError())

    this.builder.if(test, Builder.block(block))
  }

  _generateOptional() {
    const test = this._getConditionalTest()
    const block = utils.callbackWithError(this._getError())
    const last = Builder().if(test, Builder.block(block))
    const has = this._getHasOwnProperty()
    if (has) {
      this.builder.if(this._getHasOwnProperty(), Builder.block(last.build()))
    } else {
      this.builder.push(...last.build())
    }
  }
}
