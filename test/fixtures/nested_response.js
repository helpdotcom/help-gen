'use strict'

const validators = require('@helpdotcom/is')
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
  if (!this.room || ___0 !== 'object') {
    out.valid = false
    out.msg = `property "room" is invalid. Expected type "object", got ${ ___0 }`
    return out
  }
  const ___1 = typeof this.room.participant
  if (!this.room.participant || ___1 !== 'object') {
    out.valid = false
    out.msg = `property "room.participant" is invalid. Expected type "object", got ${ ___1 }`
    return out
  }
  if (!validators.isUUID(this.room.participant.id)) {
    out.valid = false
    out.msg = 'property "room.participant.id" is invalid. Expected type "uuid"'
    return out
  }
  return out
}
