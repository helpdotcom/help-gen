'use strict'

const assert = require('assert')
const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const ERROR = 'var has already been declared. THIS SHOULD NEVER HAPPEN!'

module.exports = class EnumCheck extends Base {
  constructor(...args) {
    super(...args)
    this._varName = this._declareVar()
    this.prop._varName = this._varName
  }

  _declareVar() {
    const prop = this.prop
    const name = prop.path.replace(/[^\w]/g, '')

    // This should never happen
    assert(!this.validator.file.hasVarForProp(prop), `"${prop.path}": ${ERROR}`)

    const items = prop.values.map((item) => {
      if (typeof item === 'string') return Builder.string(item)
      return Builder.number(item)
    })

    const nodeArg = Builder.array(items)
    const node = Builder.new('Set', [nodeArg])
    const varName = `ENUM_${name}`
    return this.validator.file.declareTopLevelVar(this.prop, varName, node)
  }

  _getTypeof() {
    const wrapped = this.validator._wrap(this.prop.path)
    return Builder.not(Builder.callFunction(`${this._varName}.has`, [
      Builder.objectPath(wrapped)
    ]))
  }
}
