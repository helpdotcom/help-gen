'use strict'

const test = require('tap').test
const PathEach = require('../lib/path-each')

test('PathEach - simple', (t) => {
  t.plan(4)
  const opts = {
    name: 'biscuits'
  , path: 'biscuits'
  , type: 'string'
  }

  const pe = new PathEach(opts)
  pe.on('single', (obj) => {
    t.equal(obj.name, opts.name)
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
    name: 'roomParticipantId'
  , path: 'room.participant.id'
  , type: 'uuid'
  }

  const exp = [
    { name: 'roomParticipantId'
    , path: 'room'
    , type: 'object'
    }
  , { name: 'roomParticipantId'
    , path: 'room.participant'
    , type: 'object'
    }
  , { name: 'roomParticipantId'
    , path: 'room.participant.id'
    , type: 'uuid'
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
