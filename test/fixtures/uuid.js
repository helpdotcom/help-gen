'use strict'

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
      cb(new TypeError(`Missing or invalid required param (room) for name room. Expected object, got ${ ___0 }`))
    })
  }
  const ___1 = typeof obj.room.id
  if (___1 !== 'string') {
    return setImmediate(() => {
      cb(new TypeError(`Missing or invalid required param (room.id) for name roomId. Expected string, got ${ ___1 }`))
    })
  }
  if (!isv4UUID(obj.id)) {
    return setImmediate(() => {
      cb(new TypeError('Missing or invalid required param (id) for name id. Expected uuid'))
    })
  }
  return setImmediate(() => {
    cb(null, obj)
  })
}

function isv4UUID(s) {
  return typeof s === 'string' && isUUID(s) === 4
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
