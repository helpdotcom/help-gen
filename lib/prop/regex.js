'use strict'

const Base = require('./base')
const toStringArg = require('./symbols').toStringArg

module.exports = class RegexProp extends Base {
  constructor(re) {
    super()
    this._type = 'regex'
    this._value = null

    if (re) {
      this.value(re)
    }
  }

  get [toStringArg]() {
    return this._value
  }

  value(val) {
    if (!/^\/\^.*\$\/[^/]*$/.test(val)) {
      throw new Error('Regular expressions for Prop.regex() need to start ' +
                      'with ^ and end with $')
    }

    this._value = val
    return this
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      value: this._value
    })
  }
}
