'use strict'

const validators = require('@helpdotcom/is')
module.exports = User

function User(opts) {
  opts = opts || {}
  this.createdAt = opts.createdAt
}

User.fromRow = function fromRow(opts) {
  return new User(opts)
}

User.prototype.isValid = function isValid() {
  const out = {
    valid: true,
    msg: ''
  }
  if (!validators.isDate(this.createdAt)) {
    out.valid = false
    out.msg = 'property "createdAt" is invalid. Expected type "date"'
    return out
  }
  return out
}
