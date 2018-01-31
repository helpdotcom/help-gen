'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')

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

  _getTypeof() {
    return Builder.not(Builder.callFunction(`${this._varName}.test`, [
      Builder.objectPath(this.path)
    ]))
  }
}
