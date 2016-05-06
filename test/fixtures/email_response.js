'use strict'

const validators = require('@helpdotcom/is')
module.exports = User

function User(opts) {
  opts = opts || {}
  this.email = opts.email
}

User.fromRow = function fromRow(opts) {
  return new User(opts)
}

User.prototype.isValid = function isValid() {
  const out = {
    valid: true,
    msg: ''
  }
  if (!validators.isEmail(this.email)) {
    out.valid = false
    out.msg = 'property "email" is invalid. Expected type "email"'
    return out
  }
  return out
}
