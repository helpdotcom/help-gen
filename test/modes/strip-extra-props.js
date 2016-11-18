'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const { compile } = require('../common')

test('validator - always strip extraneous properties', {
  skip: process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1'
      && 'stripping not enabled'
}, (t) => {
  const input = {
    name: 'striptest'
  , type: 'test'
  , props: [
      Prop.string().path('a')
    , Prop.string().path('b')
    , Prop.string().path('c').optional()
    ]
  }

  const fn = compile(input)

  const tests = [
    { input: { a: 'a', b: 'b', c: 'c', d: 'd' }
    , error: null
    , name: 'one extraneous property'
    }
  ]

  for (const item of tests) {
    t.test(item.name, (tt) => {
      const valid = fn(item.input, (err, out) => {
        if (item.error === null) {
          tt.equal(err, null, 'does not fail')
          tt.equal(valid, true, 'returns true')
          tt.ok(out !== item, 'output is not input')
          tt.ok(!out.d, 'output does not contain extra props')
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
