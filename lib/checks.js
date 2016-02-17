'use strict'

exports.checkValidation = function checkValidation(obj) {
  if (!obj.name) {
    throw new Error('Invalid rule. `name` is required')
  }

  if (typeof obj.name !== 'string') {
    throw new TypeError('Invalid rule. `name` must be a string')
  }

  if (!obj.type) {
    throw new Error('Invalid rule. `type` is required')
  }

  if (typeof obj.type !== 'string') {
    throw new TypeError('Invalid rule. `type` must be a string')
  }

  if (!obj.path) {
    throw new Error('Invalid rule. `path` is required')
  }

  if (typeof obj.path !== 'string') {
    throw new TypeError('Invalid rule. `path` must be a string')
  }
}
