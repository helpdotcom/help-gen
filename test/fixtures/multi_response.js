'use strict'

module.exports = User

function User(opts) {
  opts = opts || {}
  this.id = opts['id'] || undefined
  this.test = opts['test'] || undefined
}

User.fromRow = function fromRow(opts) {
  return new User(opts)
}
