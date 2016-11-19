'use strict'

const Builder = require('@helpdotcom/build-ast')
const utils = require('../utils')
const TYPES = require('../types')

module.exports = class BaseCheck {
  constructor(config) {
    this.prop = config.prop
    this.validator = config.validator
    this.path = config.path
    this.displayPath = config.displayPath
    this._targetVarName = config.storeResultIn
    this._parentCheck = config.parentCheck || null

    if (this._parentCheck) {
      this._loopIndex = this._parentCheck._getChildLoopIndex()

      /* istanbul ignore else */
      if (!this.validator) {
        this.validator = this._parentCheck.validator
      }
    } else {
      this._loopIndex = 1
    }
  }

  generate() {
    const builder = Builder()

    if (this.prop.required) {
      builder.push(...this._generateRequired())
    } else {
      builder.push(...this._generateOptional())
    }

    builder.push(...this._afterSuccessfulComparison())

    return builder.build()
  }

  _afterSuccessfulComparison() {
    if (this.validator.stripExtraneousProperties) {
      return this._assignToTargetVariable(Builder.objectPath(this.path))
    } else {
      return []
    }
  }

  _assignToTargetVariable(expression) {
    return Builder().assign(`${this._targetVarName}`
                          , expression).build()
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
    const has = utils.getHasForPath(this.path)
    if (has) {
      return Builder()
          .if(has
            , Builder.block(this._generateRequired()))
          .build()
    } else {
      // This happens if and only if this instance is marked optional,
      // but refers to an immediate child Prop of an Prop.array(), which does
      // not make sense.
      // Resolve that by always acting like this.prop is not optional.
      return this._generateRequired()
    }
  }

  isRoot() {
    // Note: Children of a top-level ArrayCheck count as roots, too, so
    // this is not equivalent to this._parentCheck === null
    return !utils.isObjectPath(utils.maybeStripLoopVar(this.path))
  }

  _getChildLoopIndex() {
    return this._loopIndex
  }
}
