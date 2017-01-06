'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const Validator = require('../../').Validator
const { createModule } = require('../common')

test('validator - can store the result in a specific variable and work sync', {
  skip: process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1'
      && 'stripping not enabled'
}, (t) => {
  const input = {
    name: 'sync_resultvar_test'
  , type: 'test'
  , props: [
      Prop.regex(/^\w+$/).path('a')
    , Prop.regex(/^\w+$/).path('b')
    , Prop.string().path('c').optional()
    ]
  , synchronousReturn: true
  , resultVar: 'foobar'
  }

  const v = new Validator(input)
  const code = v.generate()
  const fn = createModule(code)

  const tests = [
    { input: { a: 'a', b: 'b', c: 'c', d: 'd' }
    , output: { a: 'a', b: 'b', c: 'c' }
    , error: null
    , name: 'one extraneous property'
    }
  ]

  for (const item of tests) {
    t.test(item.name, (tt) => {
      let out, err = null
      try {
        out = fn(item.input)
      } catch (e) {
        err = e
      }

      if (item.error === null) {
        tt.equal(err, null, 'does not fail')
        tt.same(out, item.output, 'output is correct')
        tt.ok(out !== item, 'output is not input')
        tt.ok(!out.d, 'output does not contain extra props')
      } else {
        tt.type(err, Error)
        tt.match(err.message, item.error)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
      }
      tt.end()
    })
  }

  t.end()
})
