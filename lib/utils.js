'use strict'

const parse = require('acorn').parse

exports.parseJS = function parseJS(str) {
  return parse(str, {
    ecmaVersion: 6
  })
}
