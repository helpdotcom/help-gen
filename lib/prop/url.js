'use strict'

const Base = require('./base')

module.exports = class UrlProp extends Base {
  constructor() {
    super()
    this._type = 'url'
  }
}
