'use strict'

const tld = require('tldjs')
const emailRE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/

module.exports = function fn(obj, cb) {
  if (!obj || typeof obj !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('obj must be an object'))
    })
  }
}

function isEmail(s) {
  return tld.tldExists(s) && emailRE.test(s) && s.length < 255
}

function isDate(d) {
  let date = new Date(d)
  let a = date.getDate()
  return a === a
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
      if (c < 48) return 0
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
