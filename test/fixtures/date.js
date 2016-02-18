'use strict'

module.exports = function biscuits(obj, cb) {
  if (!obj || typeof obj !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('obj must be an object'))
    })
  }
  const ___0 = typeof obj.room
  if (!obj.room || typeof obj.room !== 'object') {
    return setImmediate(() => {
      cb(new TypeError(`Missing or invalid required param (room) for name room. Expected object, got ${ ___0 }`))
    })
  }
  const ___1 = typeof obj.room.id
  if (typeof obj.room.id !== 'string') {
    return setImmediate(() => {
      cb(new TypeError(`Missing or invalid required param (room.id) for name roomId. Expected string, got ${ ___1 }`))
    })
  }
  if (!isDate(obj.createdAt)) {
    return setImmediate(() => {
      cb(new TypeError('Missing or invalid required param (createdAt) for name createdAt. Expected date'))
    })
  }
  return setImmediate(() => {
    cb(null, obj)
  })
}

function isDate(d) {
  let date = new Date(d)
  let a = date.getDate()
  return a === a
}
