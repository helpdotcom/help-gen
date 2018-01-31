'use strict'

const Base = require('./base')

module.exports = class EmailProp extends Base {
  constructor() {
    super()
    this._type = 'email'
    this._allowName = false
  }

  allowName() {
    this._allowName = true
    return this
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      allowName: this._allowName
    })
  }
}
