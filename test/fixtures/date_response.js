'use strict'

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
  if (!isDate(this.createdAt)) {
    out.valid = false
    out.msg = 'property "createdAt" is invalid. Expected type "date"'
    return out
  }
  return out
}

function isDate(d) {
  let date = new Date(d)
  let a = date.getDate()
  return a === a
}
