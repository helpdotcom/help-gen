'use strict';
module.exports = function biscuits(obj, cb) {
  if (!obj || typeof obj !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('obj must be an object'))
    })
  }
  if (!obj['room'] || typeof obj['room'] !== 'object') {
    return setImmediate(() => {
      cb(new TypeError('Missing required param (room) for name room'))
    })
  }
  if (typeof obj['room']['id'] !== 'string') {
    return setImmediate(() => {
      cb(new TypeError('Missing required param (room.id) for name roomId'))
    })
  }
}
