'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')

module.exports = class RegexCheck extends Base {
  constructor(...args) {
    super(...args)
    this._varName = this._declareVar()
    this.prop._varName = this._varName
  }

  _declareVar() {
    const prop = this.prop
    if (this.validator.file.hasVarForProp(prop)) {
      const name = this.validator.file.variableNames.get(prop.path)
      return this.validator.file.variables.get(name).name
    }

    const varName = this.validator.file.nextVar()
    const node = Builder.regex(prop.value)
    return this.validator.file.declareTopLevelVar(this.prop, varName, node)
  }

  _getTypeof() {
    const wrapped = this.validator._wrap(this.prop.path)
    return Builder.not(Builder.callFunction(`${this._varName}.test`, [
      Builder.objectPath(wrapped)
    ]))
  }
}
