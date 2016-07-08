'use strict'

const test = require('tap').test
const utils = require('../lib/utils')

test('varNeedsBrackets', (t) => {
  const v = utils.varNeedsBrackets
  t.equal(v('test'), false)
  t.equal(v('room-id'), true)
  t.equal(v('_room-id'), true)
  t.equal(v('room id'), true)
  t.equal(v('7632342fds'), true)
  t.equal(v('room_id'), false)
  t.equal(v('room_$id'), false)
  t.equal(v('room_#id'), true)
  t.end()
})
