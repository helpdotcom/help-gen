'use strict'

module.exports = User

function User(opts) {
  opts = opts || {}
}

User.fromRow = function fromRow(opts) {
  return new User(opts)
}

User.prototype.isValid = function isValid() {
  const out = {
    valid: true,
    msg: ''
  }
  return out
}
