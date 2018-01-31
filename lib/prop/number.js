'use strict'

const Base = require('./base')

module.exports = class NumberProp extends Base {
  constructor() {
    super()
    this._type = 'number'
    this._min = null
    this._max = null
  }

  min(n) {
    if (typeof n !== 'number') {
      throw new TypeError('min must be a number')
    }
    this._min = n
    return this
  }

  max(n) {
    if (typeof n !== 'number') {
      throw new TypeError('max must be a number')
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
