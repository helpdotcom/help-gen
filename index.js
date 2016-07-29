'use strict'

exports.Validator = require('./lib/validator')

Object.defineProperty(exports, 'docs', {
  get() {
    return require('./lib/docs')
  }
})
