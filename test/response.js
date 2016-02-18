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
    generate('test', [''])
  }, /Invalid rule. `name` is required/)

  let out = generate('User', [])
  t.equal(out, fixture('basic_response.js'))

  out = generate('User', [
    {
      name: 'id'
    , type: 'uuid'
    , path: 'id'
    }
  , {
      name: 'test'
    , type: 'string'
    , path: 'test'
    }
  , {
      name: 'roomId'
    , type: 'uuid'
    , path: 'room.id'
    }
  , {
      name: 'roomName'
    , type: 'string'
    , path: 'room.name'
    }
  ])
  t.equal(out, fixture('multi_response.js'))

  // Invalid type throws
  t.throws(function() {
    generate('biscuits', [
      { name: 'blah'
      , type: 'biscuits'
      , path: 'blah'
      }
    ])
  }, /Invalid type: biscuits. Implement me/)

  t.end()
})
