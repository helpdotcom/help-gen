'use strict'

const Builder = require('@helpdotcom/build-ast')
const Prop = require('@helpdotcom/nano-prop')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath
const E = Builder.ast.expression
const B = Builder.block
const BINARY = Builder.ast.expression.BINARY
const { getCheck } = require('./')

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

  _getConditionalTest() {
    return this._getTypeof()
  }

  _generateRequired() {
    const test = this._getConditionalTest()

    const block = this._callbackWithError(this._getError())
    const b = Builder()
    b.if(test, B(block))

    if (this._isTrivial()) {
      b.push(...super._afterSuccessfulComparison())
      return b.build()
    }

    const builder = Builder()

    if (this.validator.performDeepClone) {
      builder.push(...this._assignToTargetVariable(this._generateInitialCopy()))
    }

    if (this.validator.failOnExtraneousProperties) {
      builder.push(...this._checkForExtraneousProperties())
    }

    for (const child of this._getChildren()) {
      builder.push(...child.generate())
    }

    if (this.prop.allowNull) {
      const if_block = Builder.block([
        ...b.build()
      , ...builder.build()
      ])

      let else_block
      if (this.validator.performDeepClone) {
        else_block = Builder.block([
          ...this._assignToTargetVariable(Builder.id('null'))
        ])
      }

      const out = Builder()
        .if(this._getIsNotNull(), if_block, else_block)
        .build()

      return out
    }

    b.push(...builder.build())
    return b.build()
  }

  _afterSuccessfulComparison() {
    return []
  }

  _checkForExtraneousProperties() {
    const childPaths = this.prop.props.map((p) => {
      return p.path
    })

    const b = Builder()

    const expectedKeyCount = Builder.number(this.prop.props.length)
    const keys = Builder.callFunction('Object.keys', [
      OP(this.path)
    ])
    const actualKeyCount =
        E.MEMBER(keys, Builder.id('length'), false)

    const keysProp = Prop.array().props(Prop.enum(childPaths)).toJSON()
    const keysCheck = getCheck({
      prop: keysProp
    , path: 'keys'
    , storeResultIn: 'keys'
    , displayPath: `Object.keys(${this.displayPath})`
    , parentCheck: this
    , skipTypeof: true // Object.keys() is always an Array instance.
    })

    const testBuilder = Builder()
    testBuilder.declare('const', 'keys', keys)
    testBuilder.push(...keysCheck.generate())

    const testBlock = B(testBuilder.build())
    if (this._hasOptionalProperties()) {
      b.push(testBlock)
    } else {
      b.if(BINARY(actualKeyCount, '!==', expectedKeyCount), testBlock)
    }
    return b.build()
  }

  _hasOptionalProperties() {
    return !this._isTrivial() && this.prop.props.some((prop) => {
      return prop.required === false
    })
  }

  _getChildren() {
    if (this._isTrivial()) return []

    return this.prop.props.map((child) => {
      const fullChildPath = `${this.path}.${child.path}`
      const displayChildPath =
          this.isRoot() ? child.path : `${this.displayPath}.${child.path}`

      return getCheck({
        prop: child
      , path: fullChildPath
      , storeResultIn: `${this._targetVarName}.${child.path}`
      , displayPath: displayChildPath
      , parentCheck: this
      })
    })
  }
}
