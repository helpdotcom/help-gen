'use strict'

module.exports = Base

function Base(opts) {
  opts = opts || {}
}

Base.fromRow = function fromRow(opts) {
  return new Base(opts)
}
