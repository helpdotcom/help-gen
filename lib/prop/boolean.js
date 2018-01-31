'use strict'

const Base = require('./base')

module.exports = class BooleanProp extends Base {
  constructor() {
    super()
    this._type = 'boolean'
  }
}
