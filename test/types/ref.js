'use strict'

const test = require('tap').test
const common = require('../common')
const Prop = require('@helpdotcom/nano-prop')

class DummyModel {
  constructor(obj) {
    if (!obj)
      throw new Error('Called DummyModel constructor without object')
  }

  _validate() {
    return this
  }
}

function hookedRequire(path) {
  if (/\bindex$/.test(path)) {
    return {
      DummyModel
    }
  }
}

test('Prop.ref()', (t) => {
  const fn = common.compile({
    name: 'ref_test'
  , type: 'test'
  , props: [
      Prop
        .ref('DummyModel')
        .path('pageviews')
    ]
  , hookedRequire
  , synchronousReturn: true
  })

  t.test('empty object fails', (tt) => {
    tt.throws(() => {
      fn({})
    }, /Called DummyModel constructor without object/)

    tt.end()
  })

  t.test('model instance passes', (tt) => {
    const input = { pageviews: new DummyModel({}) }
    const output = fn(input)
    tt.same(output, input)

    tt.end()
  })

  t.end()
})

test('Prop.ref().multi()', (t) => {
  const fn = common.compile({
    name: 'ref_test'
  , type: 'test'
  , props: [
      Prop
        .ref('DummyModel')
        .path('pageviews')
        .multi()
    ]
  , hookedRequire
  , synchronousReturn: true
  })

  t.test('empty object fails', (tt) => {
    tt.throws(() => {
      fn({})
    }, /Missing or invalid param: "pageviews". Expected array/)

    tt.end()
  })

  t.test('model instance passes', (tt) => {
    const input = { pageviews: [new DummyModel({})] }
    const output = fn(input)
    tt.same(output, input)

    tt.end()
  })

  t.end()
})
