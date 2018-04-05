'use strict'

const toStringArg = require('./symbols').toStringArg

module.exports = class Base {
  constructor() {
    this._path = null
    this._required = true
    this._description = null
    this._example = null
    this._type = null
    this._allowNull = false
    this._unique = null
  }

  get [toStringArg]() {
    return ''
  }

  path(str) {
    if (typeof str !== 'string') {
      throw new TypeError(`"path" must be a string, found ${str}.`)
    }
    this._path = str
    return this
  }

  required(val) {
    this._required = !!val
    return this
  }

  optional() {
    this._required = false
    return this
  }

  desc(str) {
    this._description = str
    return this
  }

  description(str) {
    return this.desc(str)
  }

  example(val) {
    this._example = val
    return this
  }

  allowNull(val = true) {
    this._allowNull = !!val
    return this
  }

  unique(val = true) {
    this._unique = !!val
    return this
  }

  toJSON() {
    return {
      path: this._path
    , required: this._required
    , description: this._description
    , example: this._example
    , type: this._type
    , allowNull: this._allowNull
    , unique: this._unique
    }
  }

  get [Symbol.toStringTag]() {
    return 'NanoProp'
  }

  toString() {
    const type = this._type
    let s = `Prop.${type}(${this[toStringArg]})`

    if (this._path) s += `.path(${JSON.stringify(this._path)})`
    if (!this._required) s += '.optional()'
    if (this._allowNull) s += '.allowNull()'
    if (this._min && typeof this._min === 'number') {
      s += `.min(${this._min})`
    }

    if (this._max && typeof this._max === 'number') {
      s += `.max(${this._max})`
    }

    if (this._allowName) {
      s += '.allowName()'
    }

    if (this._props) {
      const str = this._props.toString()
      s += `.props(${str})`
    }

    if (type === 'ref' && this._multi) {
      s += '.multi()'
    }

    return s
  }
}
