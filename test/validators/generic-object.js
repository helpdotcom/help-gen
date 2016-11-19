'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const { compile } = require('../common')

test('validator - object without props', (t) => {
  const input = {
    name: 'arraytest'
  , type: 'test'
  , props: [
      Prop.object()
          .path('a')
    ]
  }

  const fn = compile(input)

  const tests = [
    { input: { a: {} }
    , error: null
    , name: 'empty object'
    }
  , { input: { a: { foo: 'bar' } }
    , error: null
    , name: 'object with random field'
    }
  ]

  for (const item of tests) {
    t.test(item.name, (tt) => {
      const valid = fn(item.input, (err) => {
        if (item.error === null) {
          tt.equal(err, null, 'does not fail')
          tt.equal(valid, true, 'returns true')
        } else {
          tt.type(err, Error)
          tt.match(err.message, item.error)
          tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
          tt.equal(valid, false, 'returns false')
        }
        tt.end()
      })
    })
  }

  t.end()
})
