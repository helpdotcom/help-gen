'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const E = Builder.ast.expression
const OP = Builder.objectPath

module.exports = class RegexCheck extends Base {
  constructor(...args) {
    super(...args)
    this._varName = this._declareVar()
  }

  _declareVar() {
    const prop = this.prop

    const node = Builder.regex(prop.value)
    return this.validator.file.variables.add(prop.value.toString(), node)
  }

  _getBasicTypeof() {
    return Builder.not(Builder.callFunction(`${this._varName}.test`, [
      Builder.objectPath(this.path)
    ]))
  }

  _getTypeof() {
    const {required, allowNull} = this.prop
    const right = this._getBasicTypeof()

    if (required) {
      if (allowNull) {
        const check = Builder.equals(OP(this.path), Builder.id('undefined'))
        return Builder.or(check, right)
      }

      const check = E.BINARY(OP(this.path), '==', Builder.id('null'))
      return Builder.or(check, right)
    }

    if (!allowNull) {
      const check = Builder.equals(OP(this.path), Builder.id('null'))
      return Builder.or(check, right)
    }

    return right
  }
}
