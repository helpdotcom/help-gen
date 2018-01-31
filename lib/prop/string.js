'use strict'

const Base = require('./base')

module.exports = class StringProp extends Base {
  constructor() {
    super()
    this._type = 'string'
    this._min = null
    this._max = null
  }

  min(n) {
    if (typeof n !== 'number') {
      throw new TypeError('min must be a number')
    }
    if (n < 0) {
      throw new RangeError('min must be >= 0')
    }
    this._min = n
    return this
  }

  max(n) {
    if (typeof n !== 'number') {
      throw new TypeError('max must be a number')
    }
    if (n < 0) {
      throw new RangeError('max must be >= 0')
    }

    if (this._min !== null && n <= this._min) {
      throw new RangeError('max must be > min property')
    }

    this._max = n
    return this
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      min: this._min
    , max: this._max
    })
  }
}
