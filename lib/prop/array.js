'use strict'

const Base = require('./base')
const ObjectProp = require('./object')

module.exports = class ArrayProp extends Base {
  constructor() {
    super()
    this._type = 'array'
  }

  props(p) {
    if (Array.isArray(p)) {
      p = new ObjectProp().props(p)
    }

    this._props = p
    return this
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      props: this._props && this._props.toJSON()
    })
  }
}
