'use strict'

const generator = require('escodegen').generate

exports.generate = function generate(ast) {
  return generator(ast, exports.genOpts)
}

exports.customGenerate = function customGenerate(ast, opts) {
  const genOpts = Object.assign({}, exports.genOpts, {
    format: {
      quotes: 'double'
    , json: true
    , compact: true
    }
  })
  return generator(ast, genOpts)
}

exports.genOpts = {
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
