'use strict'

const EE = require('events')
const inherits = require('util').inherits

module.exports = PathEach

function PathEach(opts) {
  if (!(this instanceof PathEach))
    return new PathEach(opts)

  EE.call(this)
  this.name = opts.name
  this.path = opts.path
  this.type = opts.type
  this.splits = this.path.split('.')
  this.topLevel = this.splits[0]
  this.current = ''
  this.nested = false
}
inherits(PathEach, EE)

PathEach.prototype.process = function() {
  const splits = this.splits
  const topLevel = splits[0]

  if (splits.length === 1) {
    this.emit('single', {
      name: this.name
    , path: this.path
    , type: this.type
    })

    this.emit('end')
    return
  }

  this.nested = true

  while (splits.length) {
    if (this.current === '') {
      this.current = splits.shift()
    } else {
      this.current += `.${splits.shift()}`
    }

    let ty = splits.length ? 'object' : this.type
    this.emit('nested', {
      name: this.name
    , path: this.current
    , type: ty
    })
  }

  this.emit('end')
}
