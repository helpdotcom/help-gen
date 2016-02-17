'use strict'

module.exports = User

function User(opts) {
  opts = opts || {}
  this.id = opts.id || undefined
  this.test = opts.test || undefined
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
  if (!isv4UUID(this.id)) {
    out.valid = false
    out.msg = 'property "id" is invalid. Expected type "uuid"'
    return out
  }
  const ___0 = typeof this.test
  if (typeof this.test !== 'string') {
    out.valid = false
    out.msg = `property "test" is invalid. Expected type "string", got ${ ___0 }`
    return out
  }
  const ___1 = typeof this.room
  if (!this.room || typeof this.room !== 'object') {
    out.valid = false
    out.msg = `property "room" is invalid. Expected type "object", got ${ ___1 }`
    return out
  }
  if (!isv4UUID(this.room.id)) {
    out.valid = false
    out.msg = 'property "room.id" is invalid. Expected type "uuid"'
    return out
  }
  const ___2 = typeof this.room.name
  if (typeof this.room.name !== 'string') {
    out.valid = false
    out.msg = `property "room.name" is invalid. Expected type "string", got ${ ___2 }`
    return out
  }
  return out
}

function isv4UUID(s) {
  return isUUID(s) === 4
}

function isUUID(s) {
  var i = 0
  var len = s.length
  if (len !== 36) {
    i = 1
  }
  var stop = i + 8
  var c, v
  for (;;) {
    do {
      c = s.charCodeAt(i)
      if (c < 48)
        return 0
      if (c > 57 && ((c |= 32) < 97 || c > 102))
        return 0
    } while (++i !== stop)
    if (i === len)
      break
    c = s.charCodeAt(i)
    if (c !== 45)
      return 0
    stop = ++i + 12
    if (stop !== len)
      stop -= 8
  }
  v = s.charCodeAt(len - 22) - 48
  if (v === 1 || v === 2)
    return v
  if (v === 3 || v === 4 || v === 5) {
    c = s.charCodeAt(len - 17)
    if (c === 56 || c === 57)
      return v
    c |= 32
    if (c === 97 || c === 98)
      return v
  }
  return -1
}
