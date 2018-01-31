'use strict'

const Base = require('./base')
const toStringArg = require('./symbols').toStringArg

const VALIDATION_ERRMSG = '"values" must be an array of strings or numbers.'

module.exports = class EnumProp extends Base {
  constructor(vals) {
    super()
    this._type = 'enum'
    this._values = vals
  }

  get [toStringArg]() {
    return '[' + (this._values || []).map((item) => {
      if (typeof item === 'number') return item
      return JSON.stringify(item)
    }).join(', ') + ']'
  }

  values(vals) {
    if (!Array.isArray(vals)) {
      throw new TypeError(VALIDATION_ERRMSG)
    }
    vals.forEach((v) => {
      if (typeof v !== 'string' && typeof v !== 'number') {
        throw new TypeError(VALIDATION_ERRMSG)
      }
    })

    this._values = vals
    return this
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      values: this._values
    })
  }
}
