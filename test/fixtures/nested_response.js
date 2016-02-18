'use strict'

module.exports = Event

function Event(opts) {
  opts = opts || {}
  this.room = opts.room || { participant: { id: undefined } }
}

Event.fromRow = function fromRow(opts) {
  return new Event(opts)
}

Event.prototype.isValid = function isValid() {
  const out = {
    valid: true,
    msg: ''
  }
  const ___0 = typeof this.room
  if (!this.room || typeof this.room !== 'object') {
    out.valid = false
    out.msg = `property "room" is invalid. Expected type "object", got ${ ___0 }`
    return out
  }
  const ___1 = typeof this.room.participant
  if (!this.room.participant || typeof this.room.participant !== 'object') {
    out.valid = false
    out.msg = `property "room.participant" is invalid. Expected type "object", got ${ ___1 }`
    return out
  }
  if (!isv4UUID(this.room.participant.id)) {
    out.valid = false
    out.msg = 'property "room.participant.id" is invalid. Expected type "uuid"'
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
