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

  t.throws(function() {
    generate('test', [''])
  }, /Invalid rule. `name` is required/)

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
