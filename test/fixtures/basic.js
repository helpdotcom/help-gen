'use strict';
module.exports = function biscuits(obj, cb) {
  if (!obj || typeof obj !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('obj must be an object'))
    })
  }
  return setImmediate(() => {
    cb(null, obj)
  })
}
