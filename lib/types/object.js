'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath

module.exports = class ObjectCheck extends Base {
  constructor(...args) {
    super(...args)

    if (Array.isArray(this.prop.children)) {
      this.prop.children.sort(utils.propSort)
    }
  }

  _getTypeof() {
    const to = super._getTypeof()
    const path = this.validator._wrap(this.prop.path)
    return Builder.or(Builder.not(OP(path)), to)
  }

  _generateRequired() {
    const prop = this.prop
    const test = this._getConditionalTest()

    const block = utils.callbackWithError(this._getError())
    this.builder.if(test, Builder.block(block))

    if (Array.isArray(prop.children) && prop.children.length) {
      for (const child of prop.children) {
        this.validator.addCheck(child, this.builder)
      }
    }
  }

  _generateOptional() {
    const prop = this.prop
    const test = this._getConditionalTest()
    const b = Builder()

    const block = utils.callbackWithError(this._getError())
    b.if(test, Builder.block(block))

    if (Array.isArray(prop.children) && prop.children.length) {
      for (const child of prop.children) {
        this.validator.addCheck(child, b)
      }
    }

    const has = this._getHasOwnProperty()
    if (has) {
      this.builder.if(this._getHasOwnProperty(), Builder.block(b.build()))
    } else {
      this.builder.push(...b.build())
    }
  }
}
