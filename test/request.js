'use strict'

const test = require('tap').test
const generate = require('../').request
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
    generate.Request()
  }, /name is required/)

  t.throws(function() {
    generate('biscuits', {})
  }, /props must be an array/)

  t.throws(function() {
    generate('biscuits', [
      { type: 'enum'
      , values: [{ thing: true }]
      , path: 'roles'
      , required: true
      }
    ])
  }, /Invalid type. Item must be a string or number./)

  t.throws(function() {
    generate('biscuits', [
      { type: 'enum'
      , path: 'roles'
      , required: true
      }
    ])
  }, /values must be defined for type: enum/)

  let out = generate('biscuits', [])
  t.equal(out, fixture('basic.js'))

  out = generate('biscuits', [
    { type: 'object'
    , path: 'room'
    , required: true
    }
  , { type: 'string'
    , path: 'room.id'
    , required: true
    }
  ])

  t.equal(out, fixture('nested.js'))

  out = generate('biscuits', [
    { type: 'object'
    , path: 'room'
    , required: true
    }
  , { type: 'string'
    , path: 'room.id'
    , required: true
    }
  , { type: 'date'
    , path: 'createdAt'
    , required: true
    }
  , { type: 'string'
    , path: 'biscuits'
    , required: false
    }
  , { type: 'array'
    , path: 'roles'
    , required: true
    }
  ])

  t.equal(out, fixture('date.js'))

  out = generate('biscuits', [
    { type: 'object'
    , path: 'room'
    , required: true
    }
  , { type: 'string'
    , path: 'room.id'
    , required: true
    }
  , { type: 'date'
    , path: 'createdAt'
    , required: true
    }
  , { type: 'string'
    , path: 'biscuits'
    , required: false
    }
  , { type: 'enum'
    , path: 'roles'
    , values: ['admin', 'manager', 'agent']
    , required: true
    }
  , { type: 'enum'
    , path: 'biscuits'
    , values: [1, 2, 3]
    , required: true
    }
  ])

  t.equal(out, fixture('enum.js'))

  out = generate('biscuits', [
    { type: 'object'
    , path: 'room'
    , required: true
    }
  , { type: 'string'
    , path: 'room.id'
    , required: true
    }
  , { type: 'uuid'
    , path: 'id'
    , required: true
    }
  ])

  t.equal(out, fixture('uuid.js'))

  out = generate('biscuits', [
    { type: 'regex'
    , path: 'email'
    , value: /\S@\S\.\S/
    , required: true
    }
  , { type: 'string'
    , path: 'name'
    , required: true
    }
    // add another with the same exact regex
    // to make sure we only declare each regex once
    // :]
  , { type: 'regex'
    , path: 'email2'
    , value: /\S@\S\.\S/
    , required: true
    }
  ])

  t.equal(out, fixture('regex.js'))

  out = generate('biscuits', [
    { type: 'regex'
    , path: 'email'
    , value: '/\\S@\\S\\.\\S/im'
    , required: true
    }
  , { type: 'string'
    , path: 'name'
    , required: true
    }
  ])

  t.equal(out, fixture('regex-flags.js'))

  out = generate('biscuits', [
    { type: 'email'
    , path: 'email'
    , required: true
    }
  ])

  t.equal(out, fixture('email.js'))

  // throws with missing type
  t.throws(function() {
    generate('biscuits', [{}])
  }, /Invalid rule. `type` is required/)

  // throws with non-string type
  t.throws(function() {
    generate('biscuits', [{
      type: {}
    }])
  }, /Invalid rule. `type` must be a string/)

  // throws with missing path
  t.throws(function() {
    generate('biscuits', [{
      type: 'object'
    }])
  }, /Invalid rule. `path` is required/)

  // throws with non-string path
  t.throws(function() {
    generate('biscuits', [{
      type: 'object'
    , path: {}
    }])
  }, /Invalid rule. `path` must be a string/)

  // throws with missing required
  t.throws(function() {
    generate('biscuits', [{
      type: 'object'
    , path: 'blah'
    }])
  }, /Invalid rule. `required` is required/)

  // Invalid type throws
  t.throws(function() {
    generate('biscuits', [
      { type: 'biscuits'
      , path: 'room'
      , required: true
      }
    ])
  }, /Invalid type: biscuits. Implement me/)

  // Type regex without a value throws
  t.throws(function() {
    generate('biscuits', [
      { type: 'regex'
      , path: 'email'
      , required: true
      }
    ])
  }, /value must be defined for type: regex/)

  t.end()
})
