'use strict'

module.exports = Organization

function Organization(opts) {
  opts = opts || {}
  this.id = opts['id'] || undefined
  this.createdAt = opts['createdAt'] || undefined
  this.modifiedAt = opts['modifiedAt'] || undefined
}

Organization.fromRow = function fromRow(opts) {
  return new Organization(opts)
}
