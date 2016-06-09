'use strict'

const validators = require('@helpdotcom/is')
module.exports = biscuits
function biscuits(obj, cb) {
  if (!obj || typeof obj !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('obj must be an object'))
    })
  }
  const ___0 = typeof obj.room
  if (!obj.room || ___0 !== 'object') {
    return setImmediate(() => {
      cb(new TypeError(`Missing or invalid required param: "room". Expected object, got ${ ___0 }`))
    })
  }
  const ___1 = typeof obj.room.id
  if (___1 !== 'string') {
    return setImmediate(() => {
      cb(new TypeError(`Missing or invalid required param: "room.id". Expected string, got ${ ___1 }`))
    })
  }
  if (!validators.isDate(obj.createdAt)) {
    return setImmediate(() => {
      cb(new TypeError('Missing or invalid required param: "createdAt". Expected date'))
    })
  }
  if (!Array.isArray(obj.roles)) {
    return setImmediate(() => {
      cb(new TypeError('Missing or invalid required param: "roles". Expected array'))
    })
  }
  return setImmediate(() => {
    cb(null, obj)
  })
}
