'use strict'

const Builder = require('@helpdotcom/build-ast')
const utils = require('../utils')
const TYPES = require('../types')

module.exports = class BaseCheck {
  constructor(prop, path, validator) {
    this.prop = prop
    this.validator = validator
    this.path = path
    this.displayPath = utils.cleanPath(this.path)
  }

  generate() {
    const builder = Builder()

    if (this.prop.required) {
      builder.push(...this._generateRequired())
    } else {
      builder.push(...this._generateOptional())
    }

    return builder.build()
  }

  _getTypeof() {
    return this.validator._getTypeof(this.path, this.prop.type)
  }

  _getIsNotNull() {
    return this.validator._getPathIsNotNull(this.path)
  }

  _getError() {
    if (TYPES.BUILTINS.has(this.prop.type)) {
      return this.validator._getBuiltinTypeError(this)
    }

    return this.validator._getCustomError(this)
  }

  _getHasOwnProperty() {
    return this.validator._getHasOwnProperty(this.path)
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

    return Builder().if(test, Builder.block(block)).build()
  }

  _generateOptional() {
    const has = this._getHasOwnProperty()
    if (has) {
      return Builder()
          .if(this._getHasOwnProperty()
            , Builder.block(this._generateRequired()))
          .build()
    } else {
      return this._generateRequired()
    }
  }
}
