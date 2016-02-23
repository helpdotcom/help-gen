'use strict'

const tld = require('tldjs')
const emailRE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/
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
  if (!isEmail(this.email)) {
    out.valid = false
    out.msg = 'property "email" is invalid. Expected type "email"'
    return out
  }
  return out
}

function isEmail(s) {
  return tld.tldExists(s) && emailRE.test(s) && s.length < 255
}
