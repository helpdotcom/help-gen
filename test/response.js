'use strict'

const test = require('tap').test
const generate = require('../').response
const fs = require('fs')
const path = require('path')

function fixture(fn) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', fn), 'utf8')
}

test('generate', (t) => {
  t.throws(function() {
    generate()
  }, /name is required/)

  t.throws(function() {
    generate('test')
  }, /props must be an array/)

  t.throws(function() {
    generate('test', [{}])
  }, /Expected property to be string, got object/)

  let out = generate('User', [])
  t.equal(out, fixture('basic_response.js'))

  out = generate('User', ['id', 'test'])
  t.equal(out, fixture('multi_response.js'))

  t.end()
})
