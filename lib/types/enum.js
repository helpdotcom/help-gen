'use strict'

const assert = require('assert')
const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const ERROR = 'var has already been declared. THIS SHOULD NEVER HAPPEN!'

module.exports = class EnumCheck extends Base {
  constructor(...args) {
    super(...args)
    this._varName = this._declareVar()
  }

  _declareVar() {
    const path = this.path
    const prop = this.prop
    const name = path.replace(/[^\w]/g, '')

    // This should never happen
    assert(!this.validator.file.hasVarForPath(path), `"${path}": ${ERROR}`)

    const items = prop.values.map((item) => {
      if (typeof item === 'string') return Builder.string(item)
      return Builder.number(item)
    })

    const nodeArg = Builder.array(items)
    const node = Builder.new('Set', [nodeArg])
    const varName = `ENUM_${name}`
    return this.validator.file.declareTopLevelVar(path, varName, node)
  }

  _getTypeof() {
    return Builder.not(Builder.callFunction(`${this._varName}.has`, [
      Builder.objectPath(this.path)
    ]))
  }
}
