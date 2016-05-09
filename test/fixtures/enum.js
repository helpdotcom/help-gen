'use strict'

const validators = require('@helpdotcom/is')
const ENUM_roles = [
  'admin',
  'manager',
  'agent'
]
const ENUM_biscuits = [
  1,
  2,
  3
]
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
  if (!validators.isDate(obj.createdAt)) {
    return setImmediate(() => {
      cb(new TypeError('Missing or invalid required param (createdAt) for name createdAt. Expected date'))
    })
  }
  if (!~ENUM_roles.indexOf(obj.roles)) {
    return setImmediate(() => {
      cb(new Error('Path "roles" must be one of ["admin", "manager", "agent"]'))
    })
  }
  if (!~ENUM_biscuits.indexOf(obj.biscuits)) {
    return setImmediate(() => {
      cb(new Error('Path "biscuits" must be one of [1, 2, 3]'))
    })
  }
  return setImmediate(() => {
    cb(null, obj)
  })
}
