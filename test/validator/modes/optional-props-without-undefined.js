'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const { compileValidator } = require('../../common')

test('validator - missing props become undefined', {
  skip: process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1'
      && 'stripping not enabled'
}, (t) => {
  const input = {
    name: 'arraytest'
  , type: 'test'
  , props: [
      Prop.object()
          .path('a')
          .optional()
          .passthrough()
    ]
  }

  const fn = compileValidator(input)

  const tests = [
    { input: {}
    , output: { a: undefined }
    , error: null
    , name: 'empty object'
    }
  ]

  for (const item of tests) {
    t.test(item.name, (tt) => {
      const valid = fn(item.input, (err, out) => {
        if (item.error === null) {
          tt.equal(err, null, 'does not fail')
          tt.same(out, item.output, 'always defines property')
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
