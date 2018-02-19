'use strict'

const test = require('tap').test
const {Prop} = require('../../../')
const { compileValidator } = require('../../common')

test('validator - is desired, optional properties may be `undefined`', (t) => {
  const input = {
    name: 'arraytest'
  , type: 'test'
  , props: [
      Prop.object()
          .path('a')
          .optional()
          .passthrough()
    ]
  , optionalsMayBeUndefined: true
  }

  const fn = compileValidator(input)

  const tests = [
    { input: { a: undefined }
    , output: { a: undefined }
    , error: null
    , name: 'empty object with single property'
    }
  ]

  for (const item of tests) {
    t.test(item.name, (tt) => {
      const valid = fn(item.input, (err, out) => {
        if (item.error === null) {
          tt.equal(err, null, 'does not fail')
          tt.same(out, item.output, 'output matches input')
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
