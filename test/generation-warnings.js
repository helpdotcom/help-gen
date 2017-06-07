'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const { Log } = require('kittie')
const Validator = require('../').Validator

function shim(object, method, replacer) {
  const old = object[method]
  object[method] = replacer(object[method])
  object[method]._old = old
}
function unshim(object, method) {
  object[method] = object[method]._old || object[method]
}

function makeTest(fn) {
  return (t) => {
    const calls = []

    const logWarn = (message, context) => {
      calls.push({ message, context })
    }

    t.test('shim', (tt) => {
      shim(Log.prototype, 'warn', () => {
        return logWarn
      })
      tt.end()
    })

    t.test('test', (tt) => {
      return fn(tt, calls)
    })

    t.test('unshim', (tt) => {
      unshim(Log.prototype, 'warn')
      tt.end()
    })

    t.end()
  }
}

test('generation warnings', makeTest((tt, calls) => {
  const a = Prop.string().path('a')
  const b = Prop.number().path('b')
  const input = {
    name: 'warning_test'
  , type: 'test'
  , props: [
      a
    , b
    ]
  }

  const v = new Validator(input)
  v.generateRaw()

  tt.equal(calls.length, 4, 'has expected warnings')

  const messages = [
    'no string example'
  , 'no string min'
  , 'no string max'
  , 'no number min'
  ]

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i]
    const message = messages[i]
    tt.match(call.message, message, `matches message "${message}"`)
    tt.equal(call.context.path, (i < 3 ? a : b)._path, 'matches path')
  }

  tt.end()
}))

test('generation errors', makeTest((tt, calls) => {
  const errors = [
    [
      Prop.string().path('a')
    , 'no string example'
    ]
  , [
      Prop.string().path('a').example('a')
    , 'no string min'
    ]
  , [
      Prop.string().path('a').example('a').min(1)
    , 'no string max'
    ]
  , [
      Prop.number().path('a').example(1)
    , 'no number min'
    ]
  ]

  for (let [ prop, error ] of errors) {
    const v = new Validator({
      name: 'error_test'
      , type: 'test'
      , warningsFailGenerate: true
      , props: [ prop ]
    })

    tt.throws(() => {
      v.generateRaw()
    }, `message is "${error}"`)
  }

  tt.end()
}))
