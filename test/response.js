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
    generate.Response()
  }, /name is required/)

  t.throws(function() {
    generate('test')
  }, /props must be an array/)

  t.throws(() => {
    generate('a thing')
  }, /name must be a string that is a valid identifier/)

  t.throws(function() {
    generate('test', [''])
  }, /Invalid rule. `name` is required/)

  t.throws(() => {
    generate('biscuits', [
      { name: 'role'
      , type: 'enum'
      , path: 'role'
      , values: [{}]
      }
    ], /Invalid type. Item must be a string or number./)
  })

  let out = generate('User', [])
  t.equal(out, fixture('basic_response.js'))

  out = generate('User', [
    { name: 'email'
    , type: 'email'
    , path: 'email'
    }
  ])

  t.equal(out, fixture('email_response.js'))

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

  out = generate('User', [
    { name: 'createdAt'
    , type: 'date'
    , path: 'createdAt'
    }
  ])
  t.equal(out, fixture('date_response.js'))

  out = generate('User', [
    { name: 'createdAt'
    , type: 'date'
    , path: 'createdAt'
    }
  , { name: 'role'
    , type: 'enum'
    , values: ['admin', 'manager', 'agent']
    , path: 'role'
    }
  , { name: 'biscuits'
    , type: 'enum'
    , values: [1, 2, 3]
    , path: 'biscuits'
    }
  ])
  t.equal(out, fixture('enum_response.js'))

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

test('generate with nested object', (t) => {
  let out = generate('Event', [
    { name: 'roomParticipantId'
    , type: 'uuid'
    , path: 'room.participant.id'
    }
  ])
  t.equal(out, fixture('nested_response.js'))
  t.end()
})
