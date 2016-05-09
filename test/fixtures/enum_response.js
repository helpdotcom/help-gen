'use strict'

const validators = require('@helpdotcom/is')
const ENUM_role = [
  'admin',
  'manager',
  'agent'
]
const ENUM_biscuits = [
  1,
  2,
  3
]
module.exports = User

function User(opts) {
  opts = opts || {}
  this.createdAt = opts.createdAt
  this.role = opts.role
  this.biscuits = opts.biscuits
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
  if (!~ENUM_role.indexOf(this.role)) {
    out.valid = false
    out.msg = 'property "role" is invalid. Must be one of ["admin", "manager", "agent"]'
    return out
  }
  if (!~ENUM_biscuits.indexOf(this.biscuits)) {
    out.valid = false
    out.msg = 'property "biscuits" is invalid. Must be one of [1, 2, 3]'
    return out
  }
  return out
}
