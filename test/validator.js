'use strict'

const test = require('tap').test
const generate = require('../').validator
const fs = require('fs')
const path = require('path')

function fixture(fn) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', fn), 'utf8')
}

test('generate', (t) => {
  t.throws(function() {
    generate(null)
  }, /name is required/)

  t.throws(function() {
    generate('biscuits', {})
  }, /props must be an array/)

  let out = generate('biscuits', [])
  t.equal(out, fixture('basic.js'))

  out = generate('biscuits', [
    {
      name: 'room'
    , type: 'object'
    , path: 'room'
    , required: true
    }
  , {
      name: 'roomId'
    , type: 'string'
    , path: 'room.id'
    , required: true
    }
  ])

  t.equal(out, fixture('nested.js'))

  // throws with missing name
  t.throws(function() {
    generate('biscuits', [{}])
  }, /Invalid rule. `name` is required/)

  // throws with non-string name
  t.throws(function() {
    generate('biscuits', [{
      name: {}
    }])
  }, /Invalid rule. `name` must be a string/)

  // throws with missing type
  t.throws(function() {
    generate('biscuits', [{
      name: 'test'
    }])
  }, /Invalid rule. `type` is required/)

  // throws with non-string type
  t.throws(function() {
    generate('biscuits', [{
      name: 'test'
    , type: {}
    }])
  }, /Invalid rule. `type` must be a string/)

  // throws with missing path
  t.throws(function() {
    generate('biscuits', [{
      name: 'test'
    , type: 'object'
    }])
  }, /Invalid rule. `path` is required/)

  // throws with non-string path
  t.throws(function() {
    generate('biscuits', [{
      name: 'test'
    , type: 'object'
    , path: {}
    }])
  }, /Invalid rule. `path` must be a string/)

  // throws with missing required
  t.throws(function() {
    generate('biscuits', [{
      name: 'test'
    , type: 'object'
    , path: 'blah'
    }])
  }, /Invalid rule. `required` is required/)

  t.end()
})
