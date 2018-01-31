'use strict'

module.exports = function isProp(item) {
  return Object.prototype.toString.call(item) === '[object NanoProp]'
}
