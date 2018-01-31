'use strict'

const Base = require('./base')

module.exports = class UUIDProp extends Base {
  constructor() {
    super()
    this._type = 'uuid'
  }
}
