'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const E = Builder.ast.statement.EXPRESSION
const B = Builder.block

module.exports = class RefType extends Base {
  constructor(...args) {
    super(...args)
  }

  _getInstanceOfCheck() {
    return Builder.instanceOf(
      Builder.objectPath(this.path)
    , Builder.objectPath(`MODELS.${this.prop.name}`)
    )
  }

  _createNew() {
    const prop = this.prop
    const ctor = `MODELS.${prop.name}`
    return Builder.new(ctor, [
      Builder.objectPath(this.path)
    ])
  }

  _callValidate() {
    return E(Builder.callFunction(`${this.path}._validate`, []))
  }

  _maybeAssignResultToTarget(expression) {
    if (!this.validator.performDeepClone) {
      return expression
    }

    return this._assignToTargetVariable(expression)
  }

  _generateRequired() {
    const instanceOfCheck = this._getInstanceOfCheck()

    return Builder()
      .if(instanceOfCheck
        , B(this._maybeAssignResultToTarget(this._callValidate()))
        , B(this._maybeAssignResultToTarget(this._createNew())))
      .build()
  }

  _afterSuccessfulComparison() {
    return []
  }
}
