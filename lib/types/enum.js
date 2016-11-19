'use strict'

const assert = require('assert')
const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')

const OP = Builder.objectPath
const BINARY = Builder.ast.expression.BINARY

const ERROR = 'var has already been declared. THIS SHOULD NEVER HAPPEN!'

// Minimum number of allowed values to use a Set instance.
const SET_THRESHOLD = 3

function constantToExpression(item) {
  if (typeof item === 'string') return Builder.string(item)
  return Builder.number(item)
}

module.exports = class EnumCheck extends Base {
  constructor(...args) {
    super(...args)

    if (this.prop.values.length >= SET_THRESHOLD) {
      this._varName = this._declareVar()
    }
  }

  _declareVar() {
    const path = this.displayPath
    const prop = this.prop
    const name = path.replace(/[^\w]/g, '')

    // This should never happen
    assert(!this.validator.file.hasVarForPath(path), `"${path}": ${ERROR}`)

    const items = prop.values.map(constantToExpression)

    const nodeArg = Builder.array(items)
    const node = Builder.new('Set', [nodeArg])
    const varName = `ENUM_${name}`
    return this.validator.file.declareTopLevelVar(path, varName, node)
  }

  _getTypeof() {
    if (this.prop.values.length >= SET_THRESHOLD) {
      return Builder.not(Builder.callFunction(`${this._varName}.has`, [
        Builder.objectPath(this.path)
      ]))
    } else {
      const equalityComparisons = this.prop.values.map((value) => {
        return BINARY(OP(this.path), '!==', constantToExpression(value))
      })

      return equalityComparisons.reduce((a, b) => {
        return BINARY(a, '&&', b)
      })
    }
  }
}
