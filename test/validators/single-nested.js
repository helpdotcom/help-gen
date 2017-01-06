'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const { compile } = require('../common')

const DATE = new Date().toISOString()

test('validator - single, nested, required', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('a.bool')
    , Prop.email().path('a.email').allowNull()
    , Prop.string().path('a.string').allowNull().min(1).max(10)
    , Prop.enum(['a', 'b']).path('a.enuma')
    , Prop.uuid().path('a.uuid')
    , Prop.number().path('a.number')
    , Prop.regex(/^\d+$/).path('a.r')
    , Prop.date().path('a.date')
    , Prop.array().path('a.a').props(
        Prop.uuid()
      )
    ]
  }

  const fn = compile(input)

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
  , { input: { a: { a: [], bool: false, date: DATE, email: null } }
    , output: 'invalid param: "a.enuma". Must be one of ["a", "b"]'
    , name: 'missing enuma'
    }
  , { input: { a: { a: [], bool: false, date: DATE, email: 'el@me.com' } }
    , output: 'invalid param: "a.enuma". Must be one of ["a", "b"]'
    , name: 'missing enuma'
    }
  , {
      input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'c'
        }
      }
    , output: 'invalid param: "a.enuma". Must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , {
      input: {
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
  , {
      input: {
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
  , {
      input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        }
      }
    , output: 'invalid param: "a.r". Must match /^\\d+$/'
    , name: 'missing regex'
    }
  , {
      input: {
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
    , output: 'invalid param: "a.r". Must match /^\\d+$/'
    , name: 'invalid regex'
    }
  , {
      input: {
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
  , {
      input: {
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
  , {
      input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: null
        }
      }
    , output: 'invalid param: "a.uuid". Expected uuid'
    , name: 'missing uuid'
    }
  , {
      input: {
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
  , {
      input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: ''
        }
      }
    , output: 'invalid param: "a.string". Length must be >= 1, got 0'
    , name: 'string < min'
    }
  , {
      input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'a'
        , number: 1
        , r: 1
        , string: 'fasdfasdfasdfasdfasdfasdfdsfa'
        }
      }
    , output: 'invalid param: "a.string". Length must be <= 10, got 29'
    , name: 'string > max'
    }
  , {
      input: {
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
      tt.plan(4)
      const valid = fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
        tt.equal(valid, false, 'returns false')
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
    const valid = fn(conf, (err, out) => {
      tt.error(err)
      if (process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1') {
        tt.equal(out, conf)
      }
      tt.equal(valid, true, 'returns true')
      tt.end()
    })
  })
})

test('validator - single, nested, optional', (t) => {
  const input = {
    name: 'biscuits'
  , type: 'test'
  , props: [
      Prop.boolean().path('a.bool').optional()
    , Prop.email().path('a.email').allowNull().optional()
    , Prop.string().path('a.string').optional()
    , Prop.enum(['a', 'b']).path('a.enuma').optional()
    , Prop.uuid().path('a.uuid').optional()
    , Prop.number().path('a.number').optional()
    , Prop.regex(/^\d+$/).path('a.r').optional()
    , Prop.date().path('a.date').optional()
    , Prop.array().path('a.a').props(
        Prop.uuid()
      ).optional()
    , Prop.array().path('a.b').required(false).props(
        Prop.enum(['visitors'])
      )
    ]
  }

  const fn = compile(input)

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
  , { input: { a: { b: ['biscuits'] } }
    , output: 'invalid param: "a.b[i]". Must be one of ["visitors"]'
    , name: 'valid array containing an invalid enum'
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
  , {
      input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: null
        , enuma: 'c'
        }
      }
    , output: 'invalid param: "a.enuma". Must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , {
      input: {
        a: {
          a: []
        , bool: false
        , date: DATE
        , email: 'el@me.com'
        , enuma: 'c'
        }
      }
    , output: 'invalid param: "a.enuma". Must be one of ["a", "b"]'
    , name: 'invalid enuma'
    }
  , {
      input: {
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
  , {
      input: {
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
    , output: 'invalid param: "a.r". Must match /^\\d+$/'
    , name: 'invalid regex'
    }
  , {
      input: {
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
  , {
      input: {
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
      tt.plan(4)
      const valid = fn(item.input, (err) => {
        tt.type(err, Error)
        tt.match(err.message, item.output)
        tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
        tt.equal(valid, false, 'returns false')
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
    const valid = fn(conf, (err, out) => {
      tt.error(err)
      if (process.env.HELPGEN_STRIP_EXTRA_PROPS !== '1') {
        tt.equal(out, conf)
      }
      tt.equal(valid, true, 'returns true')
      tt.end()
    })
  })
})

test('single array with nested item', (t) => {
  const input = {
    name: 'test'
  , type: 'test'
  , props: [
      Prop.array().path('a').props(
        Prop.uuid()
      )
    ]
  }

  const fn = compile(input)

  t.doesNotThrow(() => {
    fn({
      a: ['1']
    }, () => {})
  })
  t.end()
})
