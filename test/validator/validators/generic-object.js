'use strict'

const test = require('tap').test
const {Prop} = require('../../../')
const { compileValidator } = require('../../common')

test('validator - object without props', (t) => {
  const input = {
    name: 'arraytest'
  , type: 'test'
  , props: [
      Prop.object().path('a').passthrough()
    , Prop.regex(/^abcd$/).path('b')
    , Prop.regex(/^cdef$/).path('c')
    ]
  }

  const fn = compileValidator(input)

  const tests = [
    { input: { a: {}, b: 'abcd', c: 'cdef' }
    , error: null
    , name: 'empty object'
    }
  , { input: { a: { foo: 'bar' }, b: 'abcd', c: 'cdef' }
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
