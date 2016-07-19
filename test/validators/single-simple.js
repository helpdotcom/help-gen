'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const Validator = require('../../lib/validator')

const DATE = new Date().toISOString()

test('validator - single, simple, required', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('bool').required(true)
    , Prop.email().path('email').required(true)
    , Prop.string().path('string').required(true)
    , Prop.enum(['a', 'b']).path('enuma').required(true)
    , Prop.uuid().path('u:uuid').required(true)
    , Prop.number().path('number').required(true)
    , Prop.regex(/\d/).path('r').required(true)
    , Prop.date().path('date').required(true)
    , Prop.array().path('a').required(true)
    ]
  }

  const code = new Validator(input).generate()
  // we can either eval (which I hate doing), or we can write each
  // validator to disk, which would take a lot longer
  // so, we are in tests, eval will be fine
  const fn = eval(code)
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
  , { input: { a: [], bool: false, date: DATE, email: 'el@me.com' }
    , output: 'Path "enuma" must be one of ["a", "b"]'
    , name: 'missing enuma'
    }
  , { input: { a: [], bool: false, date: DATE, email: 'el@me.com', enuma: 'c' }
    , output: 'Path "enuma" must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , { input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      }
    , output: 'invalid param: "number". Expected number, got undefined'
    , name: 'missing number'
    }
  , { input: {
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
  , { input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      }
    , output: 'Path "r" must match /\\d/'
    , name: 'missing regex'
    }
  , { input: {
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 'fasdsaf'
      }
    , output: 'Path "r" must match /\\d/'
    , name: 'invalid regex'
    }
  , { input: {
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
  , { input: {
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
  , { input: {
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
  , { input: {
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

  t.plan(errorTests.length + 1)

  for (const item of errorTests) {
    t.test(item.name, (tt) => {
      tt.plan(2)
      fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
      })
    })
  }

  const conf = {
    a: []
  , bool: false
  , date: DATE
  , email: 'el@me.com'
  , enuma: 'a'
  , number: 1
  , r: 1
  , string: '1'
  , 'u:uuid': '83565E45-AA23-4D12-8177-83713B42A020'
  }

  t.test('success', (tt) => {
    tt.plan(2)
    fn(conf, (err, out) => {
      tt.error(err)
      tt.equal(out, conf)
    })
  })
})

test('validator - single, simple, optionals', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('bool')
    , Prop.email().path('email')
    , Prop.string().path('string')
    , Prop.enum(['a', 'b']).path('enuma')
    , Prop.uuid().path('uuid')
    , Prop.number().path('number')
    , Prop.regex(/\d/).path('r')
    , Prop.date().path('date')
    , Prop.array().path('a')
    ]
  }

  const code = new Validator(input).generate()
  // we can either eval (which I hate doing), or we can write each
  // validator to disk, which would take a lot longer
  // so, we are in tests, eval will be fine
  const fn = eval(code)
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
  , { input: { a: [], bool: false, date: DATE, email: 'el@me.com', enuma: 'c' }
    , output: 'Path "enuma" must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , { input: {
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
  , { input: {
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
  , { input: {
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
  , { input: {
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
    , output: 'Path "r" must match /\\d/'
    , name: 'invalid regex'
    }
  ]

  t.plan(errorTests.length + 1)

  for (const item of errorTests) {
    t.test(item.name, (tt) => {
      tt.plan(2)
      fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
      })
    })
  }

  const conf = {
    a: []
  , bool: false
  , date: DATE
  , email: 'el@me.com'
  , enuma: 'a'
  , number: 1
  , r: 1
  , string: '1'
  , uuid: '83565E45-AA23-4D12-8177-83713B42A020'
  }

  t.test('success', (tt) => {
    tt.plan(2)
    fn(conf, (err, out) => {
      tt.error(err)
      tt.equal(out, conf)
    })
  })
})
