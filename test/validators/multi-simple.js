'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const Validator = require('../../lib/validator')
const createModule = require('./common').createModule

const DATE = new Date().toISOString()

test('validator - multi, simple, required', (t) => {
  const input = {
    name: 'biscuits'
  , multi: true
  , type: 'test'
  , props: [
      Prop.boolean().path('bool').required(true)
    , Prop.email().path('email').required(true).allowNull()
    , Prop.string().path('string').required(true).min(1).max(10)
    , Prop.enum(['a', 'b']).path('enuma').required(true)
    , Prop.uuid().path('uuid').required(true)
    , Prop.number().path('number').required(true)
    , Prop.regex(/\d/).path('r').required(true)
    , Prop.date().path('date').required(true)
    , Prop.array().path('a').required(true)
    ]
  }

  const code = new Validator(input).generate()
  const fn = createModule(code)
  const errorTests = [
    { input: [{}]
    , output: 'invalid param: "a". Expected array'
    , name: 'missing array'
    }
  , { input: [{ a: 'biscuits' }]
    , output: 'invalid param: "a". Expected array'
    , name: 'invalid array'
    }
  , { input: [{ a: [] }]
    , output: 'invalid param: "bool". Expected boolean, got undefined'
    , name: 'missing bool'
    }
  , { input: [{ a: [], bool: 'test' }]
    , output: 'invalid param: "bool". Expected boolean, got string'
    , name: 'invalid bool'
    }
  , { input: [{ a: [], bool: false }]
    , output: 'invalid param: "date". Expected date'
    , name: 'missing date'
    }
  , { input: [{ a: [], bool: false, date: 'fadf' }]
    , output: 'invalid param: "date". Expected date'
    , name: 'invalid date'
    }
  , { input: [{ a: [], bool: false, date: DATE }]
    , output: 'invalid param: "email". Expected email'
    , name: 'missing email'
    }
  , { input: [{ a: [], bool: false, date: DATE, email: 'el@me' }]
    , output: 'invalid param: "email". Expected email'
    , name: 'invalid email'
    }
  , { input: [{ a: [], bool: false, date: DATE, email: null }]
    , output: 'Path "enuma" must be one of ["a", "b"]'
    , name: 'missing enuma'
    }
  , { input: [{ a: [], bool: false, date: DATE, email: 'el@me.com' }]
    , output: 'Path "enuma" must be one of ["a", "b"]'
    , name: 'missing enuma'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'c'
      }]
    , output: 'Path "enuma" must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      }]
    , output: 'invalid param: "number". Expected number, got undefined'
    , name: 'missing number'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 'test'
      }]
    , output: 'invalid param: "number". Expected number, got string'
    , name: 'invalid number'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      }]
    , output: 'Path "r" must match /\\d/'
    , name: 'missing regex'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 'fasdsaf'
      }]
    , output: 'Path "r" must match /\\d/'
    , name: 'invalid regex'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      }]
    , output: 'invalid param: "string". Expected string, got undefined'
    , name: 'missing string'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: 1
      }]
    , output: 'invalid param: "string". Expected string, got number'
    , name: 'invalid string'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: '1'
      }]
    , output: 'invalid param: "uuid". Expected uuid'
    , name: 'missing uuid'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: ''
      }]
    , output: 'Invalid param: "string". Length must be >= 1, got 0'
    , name: 'string < min'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: 'fasdfasdfasdfasdfasdfasdfdsfa'
      }]
    , output: 'Invalid param: "string". Length must be <= 10, got 29'
    , name: 'string > max'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , r: 1
      , string: '1'
      , uuid: 'test'
      }]
    , output: 'invalid param: "uuid". Expected uuid'
    , name: 'invalid uuid'
    }
  ]

  t.plan(errorTests.length)

  for (const item of errorTests) {
    t.test(item.name, (tt) => {
      tt.plan(3)
      fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
      })
    })
  }
})

test('validator - multi, simple, optionals', (t) => {
  const input = {
    name: 'biscuits'
  , multi: true
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
  const fn = createModule(code)
  const errorTests = [
    { input: [{ a: 'biscuits' }]
    , output: 'invalid param: "a". Expected array'
    , name: 'invalid array'
    }
  , { input: [{ a: [], bool: 'test' }]
    , output: 'invalid param: "bool". Expected boolean, got string'
    , name: 'invalid bool'
    }
  , { input: [{ a: [], bool: false, date: 'fadf' }]
    , output: 'invalid param: "date". Expected date'
    , name: 'invalid date'
    }
  , { input: [{ a: [], bool: false, date: DATE, email: 'el@me' }]
    , output: 'invalid param: "email". Expected email'
    , name: 'invalid email'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'c'
      }]
    , output: 'Path "enuma" must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 'test'
      }]
    , output: 'invalid param: "number". Expected number, got string'
    , name: 'invalid number'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: 1
      }]
    , output: 'invalid param: "string". Expected string, got number'
    , name: 'invalid string'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: '1'
      , uuid: 'test'
      }]
    , output: 'invalid param: "uuid". Expected uuid'
    , name: 'invalid uuid'
    }
  , { input: [{
        a: []
      , bool: false
      , date: DATE
      , email: 'el@me.com'
      , enuma: 'a'
      , number: 1
      , string: '1'
      , uuid: 'test'
      , r: 'biscuits'
      }]
    , output: 'Path "r" must match /\\d/'
    , name: 'invalid regex'
    }
  ]

  t.plan(errorTests.length)

  for (const item of errorTests) {
    t.test(item.name, (tt) => {
      tt.plan(3)
      fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
      })
    })
  }
})
