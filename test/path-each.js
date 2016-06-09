'use strict'

const test = require('tap').test
const PathEach = require('../lib/path-each')

test('PathEach - simple', (t) => {
  t.plan(3)
  const opts = {
    path: 'biscuits'
  , type: 'string'
  }

  const pe = new PathEach(opts)
  pe.on('single', (obj) => {
    t.equal(obj.path, opts.path)
    t.equal(obj.type, opts.type)
  }).on('end', () => {
    t.pass('got end event')
  }).on('nested', (obj) => {
    t.fail('got nested event and should not have')
  }).process()
})

test('PathEach - nested', (t) => {
  t.plan(5)
  const opts = {
    path: 'room.participant.id'
  , type: 'uuid'
  }

  const exp = [
    { path: 'room'
    , type: 'object'
    , value: null
    }
  , { path: 'room.participant'
    , type: 'object'
    , value: null
    }
  , { path: 'room.participant.id'
    , type: 'uuid'
    , value: null
    }
  ]

  const actual = []

  const pe = PathEach(opts)
  pe.on('single', () => {
    t.fail('got single event and should not have')
  }).on('nested', (obj) => {
    actual.push(obj)
    t.pass('got nested event')
  }).on('end', () => {
    t.pass('got end event')
    t.deepEqual(actual, exp)
  }).process()
})
