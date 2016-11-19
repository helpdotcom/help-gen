'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath

module.exports = class ObjectCheck extends Base {
  constructor(...args) {
    super(...args)

    if (!this._isTrivial()) {
      this.prop.props.sort(utils.propSort)
    }
  }

  _isTrivial() {
    return !Array.isArray(this.prop.props) || this.prop.props.length === 0
  }

  _generateInitialCopy() {
    return Builder.object(Object.assign(...this.prop.props.map((child) => {
      return { [child.path]: Builder.id('undefined') }
    })))
  }

  _getTypeof() {
    const to = super._getTypeof()
    return Builder.or(Builder.not(OP(this.path)), to)
  }

  _generateRequired() {
    const prop = this.prop
    const test = this._getConditionalTest()

    const block = utils.callbackWithError(this._getError())
    const b = Builder()
    b.if(test, Builder.block(block))

    if (this._isTrivial()) {
      b.push(...super._afterSuccessfulComparison())
      return b.build()
    }

    if (this.validator.stripExtraneousProperties) {
      b.push(...this._assignToTargetVariable(this._generateInitialCopy()))
    }

    for (const child of prop.props) {
      const fullChildPath = `${this.path}.${child.path}`
      const displayChildPath =
          this.isRoot() ? child.path : `${this.displayPath}.${child.path}`

      const code =
          this.validator.addCheck(child
                                , fullChildPath
                                , `${this._targetVarName}.${child.path}`
                                , displayChildPath
                                , this)
      b.push(...code)
    }

    return b.build()
  }

  _afterSuccessfulComparison() {
    return []
  }
}
