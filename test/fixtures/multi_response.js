'use strict'

const validators = require('@helpdotcom/is')
module.exports = User

function User(opts) {
  opts = opts || {}
  this.id = opts.id
  this.test = opts.test
  this.room = opts.room || {
    id: undefined,
    name: undefined
  }
}

User.fromRow = function fromRow(opts) {
  return new User(opts)
}

User.prototype.isValid = function isValid() {
  const out = {
    valid: true,
    msg: ''
  }
  if (!validators.isUUID(this.id)) {
    out.valid = false
    out.msg = 'property "id" is invalid. Expected type "uuid"'
    return out
  }
  const ___0 = typeof this.test
  if (___0 !== 'string') {
    out.valid = false
    out.msg = `property "test" is invalid. Expected type "string", got ${ ___0 }`
    return out
  }
  const ___1 = typeof this.room
  if (!this.room || ___1 !== 'object') {
    out.valid = false
    out.msg = `property "room" is invalid. Expected type "object", got ${ ___1 }`
    return out
  }
  if (!validators.isUUID(this.room.id)) {
    out.valid = false
    out.msg = 'property "room.id" is invalid. Expected type "uuid"'
    return out
  }
  const ___2 = typeof this.room.name
  if (___2 !== 'string') {
    out.valid = false
    out.msg = `property "room.name" is invalid. Expected type "string", got ${ ___2 }`
    return out
  }
  return out
}
