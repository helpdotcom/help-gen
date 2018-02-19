'use strict'

const test = require('tap').test
const {Prop} = require('../../../')
const { compileValidator } = require('../../common')

test('validator - nested arrays', (t) => {
  const input = {
    name: 'arraytest'
  , type: 'test'
  , props: [
      Prop.array()
          .path('a')
          .props(Prop.array().props(Prop.enum([0, 1])))
    ]
  }

  const fn = compileValidator(input)

  const tests = [
    { input: { a: [ {} ] }
    , error: 'invalid param: "a[i]". Expected array'
    , name: 'missing array'
    }
  , { input: { a: [ [ 0 ] ] }
    , error: null
    , name: 'single element in each array'
    }
  , { input: { a: [ [ ] ] }
    , error: null
    , name: 'empty inner array'
    }
  , { input: { a: [ [ 'X' ] ] }
    , error: 'invalid param: "a[i][j]". Must be one of [0, 1]'
    , name: 'invalid value in inner array'
    }
  , { input: { a: [ ] }
    , error: null
    , name: 'empty outer array'
    }
  , { input: { }
    , error: 'invalid param: "a". Expected array'
    , name: 'missing outer array'
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
