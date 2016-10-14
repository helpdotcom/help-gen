'use strict'

const generator = require('escodegen').generate

const opts = {
  format: {
    indent: {
      style: '  '
    , base: 0
    , adjustMultilineComment: false
    }
  , space: ' '
  , json: false
  , quotes: 'single'
  , semicolons: false
  , compact: false
  }
}

module.exports = function toCode(ast) {
  return generator(ast, opts)
}
