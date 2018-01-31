'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const { compileValidator } = require('../../common')

test('validator - always fail on extraneous properties', {
  skip: process.env.HELPGEN_FAIL_EXTRA_PROPS !== '1'
      && 'failing on extra props not enabled'
}, (t) => {
  const input = {
    name: 'striptest'
  , type: 'test'
  , props: [
      Prop.string().path('a')
    , Prop.string().path('b')
    , Prop.string().path('c').optional()
    , Prop.object().path('sample').passthrough()
    ]
  }

  const fn = compileValidator(input)

  const tests = [
    { input: { a: 'a', b: 'b', c: 'c', d: 'd', sample: { passed_prop: 4 } }
    , error: 'Missing or invalid param: "Object.keys(obj)[i]".' +
             ' Must be one of ["a", "b", "c", "sample"]'
    , name: 'one extraneous property'
    }
  ]

  for (const item of tests) {
    t.test(item.name, (tt) => {
      const valid = fn(item.input, (err, out) => {
        tt.type(err, Error)
        tt.match(err.message, item.error)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
        tt.equal(valid, false, 'returns false')
        tt.end()
      })
    })
  }

  t.end()
})
