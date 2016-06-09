'use strict'

const validators = require('@helpdotcom/is')
module.exports = biscuits
function biscuits(obj, cb) {
  if (!obj || typeof obj !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('obj must be an object'))
    })
  }
  if (!validators.isEmail(obj.email)) {
    return setImmediate(() => {
      cb(new TypeError('Missing or invalid required param: "email". Expected email'))
    })
  }
  return setImmediate(() => {
    cb(null, obj)
  })
}
