'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath

module.exports = class ObjectCheck extends Base {
  constructor(...args) {
    super(...args)

    if (Array.isArray(this.prop.props)) {
      this.prop.props.sort(utils.propSort)
    }
  }

  _getTypeof() {
    const to = super._getTypeof()
    return Builder.or(Builder.not(OP(this.path)), to)
  }

  _generateRequired() {
    const prop = this.prop
    const test = this._getConditionalTest()

    const block = utils.callbackWithError(this._getError())
    const builder = Builder()
    builder.if(test, Builder.block(block))

    if (Array.isArray(prop.props) && prop.props.length) {
      for (const child of prop.props) {
        const fullChildPath = `${this.path}.${child.path}`
        builder.push(...this.validator.addCheck(child, fullChildPath))
      }
    }

    return builder.build()
  }
}
