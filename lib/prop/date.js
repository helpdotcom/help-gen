'use strict'

const Base = require('./base')

module.exports = class DateProp extends Base {
  constructor() {
    super()
    this._type = 'date'
  }
}
