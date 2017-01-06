'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const { compile } = require('../common')

const DATE = new Date().toISOString()

test('validator - single, simple, required', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('bool')
    , Prop.email().path('email').allowNull()
    , Prop.string().path('string').allowNull().min(1).max(10)
    , Prop.enum(['a', 'b']).path('enuma')
    , Prop.uuid().path('u:uuid')
    , Prop.number().path('number').allowNull()
    , Prop.regex(/^\d+$/).path('r')
    , Prop.date().path('date')
    , Prop.array().path('a')
    ]
  }

  const fn = compile(input)

  const errorTests = [
    { input: {}
    , output: 'invalid param: "a". Expected array'
    , name: 'missing array'
    }
  , { input: { a: 'biscuits' }
    , output: 'invalid param: "a". Expected array'
    , name: 'invalid array'
    }
  , { input: { a: [] }
    , output: 'invalid param: "bool". Expected boolean, got undefined'
    , name: 'missing bool'
    }
  , { input: { a: [], bool: 'test' }
    , output: 'invalid param: "bool". Expected boolean, got string'
    , name: 'invalid bool'
    }
  , { input: { a: [], bool: false }
    , output: 'invalid param: "date". Expected date'
    , name: 'missing date'
    }
  , { input: { a: [], bool: false, date: 'fadf' }
    , output: 'invalid param: "date". Expected date'
    , name: 'invalid date'
    }
  , { input: { a: [], bool: false, date: DATE }
    , output: 'invalid param: "email". Expected email'
    , name: 'missing email'
    }
  , { input: { a: [], bool: false, date: DATE, email: 'el@me' }
    , output: 'invalid param: "email". Expected email'
    , name: 'invalid email'
    }
  , { input: { a: [], bool: false, date: DATE, email: null, enuma: 'c' }
    , output: 'invalid param: "enuma". Must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , { input: { a: [], bool: false, date: DATE, email: 'el@me.com' }
    , output: 'invalid param: "enuma". Must be one of ["a", "b"]'
    , name: 'missing enuma'
    }
  , { input: { a: [], bool: false, date: DATE, email: 'el@me.com', enuma: 'c' }
    , output: 'invalid param: "enuma". Must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      }
    , output: 'invalid param: "number". Expected number, got undefined'
    , name: 'missing number'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 'test'
      }
    , output: 'invalid param: "number". Expected number, got string'
    , name: 'invalid number'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      }
    , output: 'invalid param: "r". Must match /^\\d+$/'
    , name: 'missing regex'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 'fasdsaf'
      }
    , output: 'invalid param: "r". Must match /^\\d+$/'
    , name: 'invalid regex'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      }
    , output: 'invalid param: "string". Expected string, got undefined'
    , name: 'missing string'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: ''
      }
    , output: 'invalid param: "string". Length must be >= 1, got 0'
    , name: 'invalid string length'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: 1
      }
    , output: 'invalid param: "string". Expected string, got number'
    , name: 'invalid string'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: '1'
      }
    , output: 'invalid param: "u:uuid". Expected uuid'
    , name: 'missing uuid'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: null
      }
    , output: 'invalid param: "u:uuid". Expected uuid'
    , name: 'missing uuid'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: ''
      }
    , output: 'invalid param: "string". Length must be >= 1, got 0'
    , name: 'string < min'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: 'fasdfasdfasdfasdfasdfasdfdsfa'
      }
    , output: 'invalid param: "string". Length must be <= 10, got 29'
    , name: 'string > max'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: '1'
      , 'u:uuid': 'test'
      }
    , output: 'invalid param: "u:uuid". Expected uuid'
    , name: 'invalid uuid'
    }
  ]

  t.plan(errorTests.length + 2)

  for (const item of errorTests) {
    t.test(item.name, (tt) => {
      tt.plan(4)
      const valid = fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
        tt.equal(valid, false, 'returns false')
      })
    })
  }

  {
    const conf = {
      a: []
    , bool: false
    , date: DATE
    , email: 'el@me.com'
    , enuma: 'a'
    , number: null
    , r: 1
    , string: '1'
    , 'u:uuid': '83565E45-AA23-4D12-8177-83713B42A020'
    }

    t.test('success', (tt) => {
      const valid = fn(conf, (err, out) => {
        tt.error(err)
        if (process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1') {
          tt.equal(out, conf)
        }
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })
  }

  {
    const conf = {
      a: []
    , bool: false
    , date: DATE
    , email: 'el@me.com'
    , enuma: 'a'
    , number: 1
    , r: 1
    , string: null
    , 'u:uuid': '83565E45-AA23-4D12-8177-83713B42A020'
    }

    t.test('success, with null', (tt) => {
      const valid = fn(conf, (err, out) => {
        tt.error(err)
        if (process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1') {
          tt.equal(out, conf)
        }
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })
  }
})

test('validator - array with string prop', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.array().path('a').props(
        Prop.string().min(1).max(5)
      )
    ]
  }

  const fn = compile(input)

  t.plan(9)
  fn({}, (err) => {
    t.type(err, Error)
    t.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
    t.match(err.message, 'invalid param: "a". Expected array')
  })

  fn({
    a: ['']
  }, (err) => {
    t.type(err, Error)
    t.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
    t.match(err.message, 'invalid param: "a[i]". Length must be >= 1, got 0')
  })

  fn({
    a: ['123456']
  }, (err) => {
    t.type(err, Error)
    t.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
    t.match(err.message, 'invalid param: "a[i]". Length must be <= 5, got 6')
  })
})

test('validator - single, simple, optionals', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('bool').optional()
    , Prop.email().path('email').allowNull().optional()
    , Prop.string().path('string').min(1).max(10).allowNull().optional()
    , Prop.enum(['a', 'b']).path('enuma').optional()
    , Prop.uuid().path('uuid').optional()
    , Prop.number().path('number').optional().allowNull()
    , Prop.regex(/^\d+$/).path('r').optional()
    , Prop.date().path('date').optional()
    , Prop.array().path('a').optional()
    ]
  }

  const fn = compile(input)

  const errorTests = [
    { input: { a: 'biscuits' }
    , output: 'invalid param: "a". Expected array'
    , name: 'invalid array'
    }
  , { input: { a: [], bool: 'test' }
    , output: 'invalid param: "bool". Expected boolean, got string'
    , name: 'invalid bool'
    }
  , { input: { a: [], bool: false, date: 'fadf' }
    , output: 'invalid param: "date". Expected date'
    , name: 'invalid date'
    }
  , { input: { a: [], bool: false, date: DATE, email: 'el@me' }
    , output: 'invalid param: "email". Expected email'
    , name: 'invalid email'
    }
  , { input: { a: [], bool: false, date: DATE, email: null, enuma: 'c' }
    , output: 'invalid param: "enuma". Must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 'test'
      }
    , output: 'invalid param: "number". Expected number, got string'
    , name: 'invalid number'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: 1
      }
    , output: 'invalid param: "string". Expected string, got number'
    , name: 'invalid string'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: ''
      }
    , output: 'invalid param: "string". Length must be >= 1, got 0'
    , name: 'string < min'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: 'fasdfasdfasdfasdfasdfasdfdsfa'
      }
    , output: 'invalid param: "string". Length must be <= 10, got 29'
    , name: 'string > max'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: null
      , uuid: 'test'
      }
    , output: 'invalid param: "uuid". Expected uuid'
    , name: 'invalid uuid'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: '1'
      , uuid: 'test'
      }
    , output: 'invalid param: "uuid". Expected uuid'
    , name: 'invalid uuid'
    }
  , {
      input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: '1'
      , uuid: 'test'
      , r: 'biscuits'
      }
    , output: 'invalid param: "r". Must match /^\\d+$/'
    , name: 'invalid regex'
    }
  ]

  t.plan(errorTests.length + 2)

  for (const item of errorTests) {
    t.test(item.name, (tt) => {
      tt.plan(4)
      const valid = fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
        tt.equal(valid, false, 'returns false')
      })
    })
  }

  {
    const conf = {
      a: []
    , bool: false
    , date: DATE
    , email: 'el@me.com'
    , enuma: 'a'
    , number: null
    , r: 1
    , string: '1'
    , uuid: '83565E45-AA23-4D12-8177-83713B42A020'
    }

    t.test('success', (tt) => {
      const valid = fn(conf, (err, out) => {
        tt.error(err)
        if (process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1') {
          tt.equal(out, conf)
        }
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })
  }

  {
    const conf = {
      a: []
    , bool: false
    , date: DATE
    , email: 'el@me.com'
    , enuma: 'a'
    , number: 1
    , r: 1
    , string: null
    , uuid: '83565E45-AA23-4D12-8177-83713B42A020'
    }

    t.test('success, with null', (tt) => {
      const valid = fn(conf, (err, out) => {
        tt.error(err)
        if (process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1') {
          tt.equal(out, conf)
        }
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })
  }
})
