'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const Validator = require('../../lib/validator')

const DATE = new Date().toISOString()

test('validator - single, nested, required', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('a.bool').required(true)
    , Prop.email().path('a.email').required(true)
    , Prop.string().path('a.string').required(true)
    , Prop.enum(['a', 'b']).path('a.enuma').required(true)
    , Prop.uuid().path('a.uuid').required(true)
    , Prop.number().path('a.number').required(true)
    , Prop.regex(/\d/).path('a.r').required(true)
    , Prop.date().path('a.date').required(true)
    , Prop.array().path('a.a').required(true).props(
        Prop.uuid().required(true)
      )
    ]
  }

  const code = new Validator(input).generate()
  // we can either eval (which I hate doing), or we can write each
  // validator to disk, which would take a lot longer
  // so, we are in tests, eval will be fine
  const fn = eval(code)
  const errorTests = [
    { input: {}
    , output: 'invalid param: "a". Expected object, got undefined'
    , name: 'missing array'
    }
  , { input: { a: { a: 'biscuits' } }
    , output: 'invalid param: "a.a". Expected array'
    , name: 'invalid array'
    }
  , { input: { a: { a: [] } }
    , output: 'invalid param: "a.bool". Expected boolean, got undefined'
    , name: 'missing bool'
    }
  , { input: { a: { a: [], bool: 'test' } }
    , output: 'invalid param: "a.bool". Expected boolean, got string'
    , name: 'invalid bool'
    }
  , { input: { a: { a: [], bool: false } }
    , output: 'invalid param: "a.date". Expected date'
    , name: 'missing date'
    }
  , { input: { a: { a: [], bool: false, date: 'fadf' } }
    , output: 'invalid param: "a.date". Expected date'
    , name: 'invalid date'
    }
  , { input: { a: { a: [], bool: false, date: DATE } }
    , output: 'invalid param: "a.email". Expected email'
    , name: 'missing email'
    }
  , { input: { a: { a: [], bool: false, date: DATE, email: 'el@me' } }
    , output: 'invalid param: "a.email". Expected email'
    , name: 'invalid email'
    }
  , { input: { a: { a: [], bool: false, date: DATE, email: 'el@me.com' } }
    , output: 'Path "a.enuma" must be one of ["a", "b"]'
    , name: 'missing enuma'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'c'
        }
      }
    , output: 'Path "a.enuma" must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        }
      }
    , output: 'invalid param: "a.number". Expected number, got undefined'
    , name: 'missing number'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 'test'
        }
      }
    , output: 'invalid param: "a.number". Expected number, got string'
    , name: 'invalid number'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        }
      }
    , output: 'Path "a.r" must match /\\d/'
    , name: 'missing regex'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 'fasdsaf'
        }
      }
    , output: 'Path "a.r" must match /\\d/'
    , name: 'invalid regex'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        }
      }
    , output: 'invalid param: "a.string". Expected string, got undefined'
    , name: 'missing string'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: 1
        }
      }
    , output: 'invalid param: "a.string". Expected string, got number'
    , name: 'invalid string'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: '1'
        }
      }
    , output: 'invalid param: "a.uuid". Expected uuid'
    , name: 'missing uuid'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: '1'
        , uuid: 'test'
        }
      }
    , output: 'invalid param: "a.uuid". Expected uuid'
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
    a: {
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
  }

  t.test('success', (tt) => {
    tt.plan(2)
    fn(conf, (err, out) => {
      tt.error(err)
      tt.equal(out, conf)
    })
  })
})

test('validator - single, nested, optional', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('a.bool')
    , Prop.email().path('a.email')
    , Prop.string().path('a.string')
    , Prop.enum(['a', 'b']).path('a.enuma')
    , Prop.uuid().path('a.uuid')
    , Prop.number().path('a.number')
    , Prop.regex(/\d/).path('a.r')
    , Prop.date().path('a.date')
    , Prop.array().path('a.a').props(
        Prop.uuid()
      )
    ]
  }

  const code = new Validator(input).generate()
  // we can either eval (which I hate doing), or we can write each
  // validator to disk, which would take a lot longer
  // so, we are in tests, eval will be fine
  const fn = eval(code)
  const errorTests = [
    { input: { a: { a: 'biscuits' } }
    , output: 'invalid param: "a.a". Expected array'
    , name: 'invalid array'
    }
  , { input: { a: null }
    , output: 'invalid param: "a". Expected object'
    , name: 'invalid array parent'
    }
  , { input: { a: { a: ['1234'] } }
    , output: 'invalid param: "a.a[i]". Expected uuid'
    , name: 'invalid array item'
    }
  , { input: { a: { a: [], bool: 'test' } }
    , output: 'invalid param: "a.bool". Expected boolean, got string'
    , name: 'invalid bool'
    }
  , { input: { a: { a: [], bool: false, date: 'fadf' } }
    , output: 'invalid param: "a.date". Expected date'
    , name: 'invalid date'
    }
  , { input: { a: { a: [], bool: false, date: DATE, email: 'el@me' } }
    , output: 'invalid param: "a.email". Expected email'
    , name: 'invalid email'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'c'
        }
      }
    , output: 'Path "a.enuma" must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 'test'
        }
      }
    , output: 'invalid param: "a.number". Expected number, got string'
    , name: 'invalid number'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 'fasdsaf'
        }
      }
    , output: 'Path "a.r" must match /\\d/'
    , name: 'invalid regex'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: 1
        }
      }
    , output: 'invalid param: "a.string". Expected string, got number'
    , name: 'invalid string'
    }
  , { input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: '1'
        , uuid: 'test'
        }
      }
    , output: 'invalid param: "a.uuid". Expected uuid'
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
    a: {
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
  }

  t.test('success', (tt) => {
    tt.plan(2)
    fn(conf, (err, out) => {
      tt.error(err)
      tt.equal(out, conf)
    })
  })
})
