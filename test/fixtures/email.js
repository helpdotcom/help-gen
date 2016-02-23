'use strict'

const tld = require('tldjs')
const emailRE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/
module.exports = function biscuits(obj, cb) {
  if (!obj || typeof obj !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('obj must be an object'))
    })
  }
  if (!isEmail(obj.email)) {
    return setImmediate(() => {
      cb(new TypeError('Missing or invalid required param (email) for name email. Expected email'))
    })
  }
  return setImmediate(() => {
    cb(null, obj)
  })
}

function isEmail(s) {
  return tld.tldExists(s) && emailRE.test(s) && s.length < 255
}
