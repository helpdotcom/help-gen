'use strict'

const test = require('tap').test
const utils = require('../lib/utils')

test('isValidIdentifier', (t) => {
  const v = utils.isValidIdentifier
  const tests = new Map([
    ['test', true]
  , ['room-id', false]
  , ['_room-id', false]
  , ['room id', false]
  , ['7632342fds', false]
  , ['room_id', true]
  , ['room_$id', true]
  , ['room_#id', false]
  ])

  for (const [name, val] of tests) {
    t.equal(v(name), val, name)
  }
  t.end()
})

test('cleanPath', (t) => {
  const clean = utils.cleanPath
  const tests = new Map([
    ['a', 'a']
  , ['fasdfds', 'fasdfds']
  , ['fd.^__IDX__', 'fd']
  , ['fd.^__IDX__.items.^__IDX__1', 'fd.items[i]']
  , ['fd.^__IDX__.items.^__IDX__1.a.^__IDX__2', 'fd.items[i].a[j]']
  ])

  for (const [name, val] of tests) {
    t.equal(clean(name), val, name)
  }
  t.end()
})
