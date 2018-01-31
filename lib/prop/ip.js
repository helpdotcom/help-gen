'use strict'

const Base = require('./base')

module.exports = class IpProp extends Base {
  constructor() {
    super()
    this._type = 'ip'
    this._allowCIDR = false
  }

  allowCIDR() {
    this._allowCIDR = true
    return this
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      allowCIDR: this._allowCIDR
    })
  }
}
