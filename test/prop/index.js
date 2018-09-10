'use strict'

const test = require('tap').test
const {Prop} = require('../../')

const baseMethods = [
  'path'
, 'required'
, 'unique'
, 'description'
, 'example'
, 'allowNull'
, 'optional'
]

function testBaseProp(name, methods) {
  test(`Prop.${name}()`, (t) => {
    const p = Prop[name]()
    t.equal(p._path, null, `${name} - path`)
    t.equal(p._required, true, `${name} - required`)
    t.equal(p._description, null, `${name} - description`)
    t.equal(p._example, null, `${name} - example`)
    t.equal(p._type, name, `${name} - type`)
    t.type(p.toJSON, 'function', `${name}.toJSON() is a function`)

    if (methods && methods.length) {
      for (const method of methods) {
        t.type(p[method], 'function', `${name}.${method}() is a function`)
        if (method !== 'multi'
            && method !== 'allowName'
            && method !== 'allowCIDR'
            && method !== 'passthrough') {
          t.match(p[`_${method}`], null, `${name} - ${method} (before)`)
        } else {
          t.match(p[`_${method}`], false, `${name} - ${method} (before)`)
        }
        if (method === 'values') {
          t.equal(p[method]([2]), p, `${name} - ${method} returns this`)
          t.match(p[`_${method}`], [2], `${name} - ${method} (after)`)
          t.match(p.toJSON()[method], [2], `${name} - ${method} bubbles toJSON`)
        } else if (method === 'allowName') {
          t.equal(p.allowName(), p, `${name} - ${method} returns this`)
          t.equal(p._allowName, true, `${name} - ${method} (after)`)
          t.match(p.toJSON()[method], true, `${name} - ${method} bubbles json`)
        } else if (method === 'max') {
          t.equal(p[method](2), p, `${name} - ${method} returns this`)
          t.match(p[`_${method}`], 2, `${name} - ${method} (after)`)
          t.equal(p.toJSON()[method], 2, `${name} - ${method} bubbles toJSON`)
        } else if (method === 'props' && name === 'object') {
          p._passthrough = false
          t.throws(() => {
            p[method](null)
          }, /only accepts an array of NanoProps/)

          t.throws(() => {
            p[method]([{}])
          }, /only accepts an array of NanoProps/)

          const op = Prop.uuid().path('test')
          t.throws(() => {
            p[method]([op]).passthrough()
          }, /are mutually exclusive/)
          t.equal(p[method]([
            op
          ]), p, `${name} = ${method} returns this`)
          t.deepEqual(p.toJSON()[method], [
            op.toJSON()
          ], `${name} - ${method} bubbles toJSON`)
        } else if (method === 'passthrough' && name === 'object') {
          p._props = null
          const op = Prop.uuid().path('test')
          t.throws(() => {
            p.passthrough().props([op])
          }, /are mutually exclusive/)

          t.equal(p[method](), p, `${name} = ${method} returns this`)
          t.equal(p.toJSON()[method], true, `${name} - ${method} bubbles`)
        } else if (method === 'props' && name === 'array') {
          const op = Prop.uuid().path('test')
          t.equal(p[method](
            op
          ), p, `${name} = ${method} returns this`)
          t.deepEqual(p.toJSON()[method],
            op.toJSON()
          , `${name} - ${method} bubbles toJSON`)

          const objprop = Prop
              .object()
              .props([
                op
              ])

          // Array notation is shorthand for an array of *objects* with that
          // property.
          t.equal(p[method]([
            op
          ]), p, `${name} = ${method} returns this`)
          t.deepEqual(p.toJSON()[method],
            objprop.toJSON()
          , `${name} - ${method} bubbles toJSON`)
        } else if (method === 'multi') {
          t.equal(p.multi(), p, `${name} - ${method} returns this`)
          t.equal(p._multi, true, `${name} - ${method} after`)
          t.equal(p.toJSON()[method], true, `${name} - ${method} bubbles`)
        } else if (method === 'value') {
          const re = /^\d+$/
          t.equal(p[method](re), p, `${name} - ${method} returns this`)
          t.match(p[`_${method}`], re, `${name} - ${method} (after)`)
          t.equal(p.toJSON()[method], re, `${name} - ${method} bubbles toJSON`)
        } else if (method === 'allowCIDR') {
          t.equal(p.allowCIDR(), p, `${name} - ${method} returns this`)
          t.equal(p._allowCIDR, true, `${name} - ${method} after`)
          t.equal(p.toJSON()[method], true, `${name} - ${method} bubbles`)
        } else if (method === 'len') {
          const p = Prop[name]()
          t.equal(p.len(5), p, `${name} - ${method} returns this`)
          t.equal(p._len, 5, `${name} - ${method} after`)
          t.equal(p.toJSON()[method], 5, `${name} - ${method} bubbles`)
        } else {
          t.equal(p[method](1), p, `${name} - ${method} returns this`)
          t.match(p[`_${method}`], 1, `${name} - ${method} (after)`)
          t.equal(p.toJSON()[method], 1, `${name} - ${method} bubbles toJSON`)
        }
      }
    }

    for (const method of baseMethods) {
      t.type(p[method], 'function', `${name}.${method}() is a function`)
      if (method === 'allowNull') {
        t.equal(p._allowNull, false, `${name} - ${method} (before)`)
        t.equal(p.allowNull(), p, `${name} - return this`)
        t.equal(p._allowNull, true, `${name} - ${method} (after)`)
        t.equal(p.toJSON()[method], true, `${name} - ${method} bubbles toJSON`)
      } else if (method === 'required') {
        t.equal(p._required, true, `${name} - ${method} (before)`)
        t.equal(p.required(false), p, `${name} - return this`)
        t.equal(p._required, false, `${name} - ${method} (after)`)
        t.equal(p.toJSON()[method], false, `${name} - ${method} bubbles toJSON`)
      } else if (method === 'unique') {
        t.equal(p._unique, null, `${name} - ${method} (before)`)
        t.equal(p.unique(), p, `${name} - return this`)
        t.equal(p._unique, true, `${name} - ${method} (after)`)
        t.equal(p.toJSON()[method], true, `${name} - ${method} bubbles toJSON`)
      } else if (method === 'optional') {
        t.ok(p.required(true)._required, `${name} - ${method} (before)`)
        t.equal(p.optional(), p, `${name} - return this`)
        t.equal(p._required, false, `${name} - ${method} (after)`)
      } else if (method === 'path') {
        t.equal(p._path, null, `${name} - ${method} (before)`)
        t.equal(p.path('p'), p, `${name} - return this`)
        t.equal(p._path, 'p', `${name} - ${method} (after)`)
        t.equal(p.toJSON()[method], 'p', `${name} - ${method} bubbles toJSON`)
      } else {
        t.match(p[`_${method}`], null, `${name} - ${method} (before)`)
        t.equal(p[method](true), p, `${name} - return this`)
        t.match(p[`_${method}`], true, `${name} - ${method} (after)`)
        t.equal(p.toJSON()[method], true, `${name} - ${method} bubbles toJSON`)
      }
    }

    t.doesNotThrow(() => {
      p.toString()
    })
    t.end()
  })
}

function testBaseToString(name, methods) {
  test(`Prop.${name}().toString()`, (t) => {
    switch (name) {
      case 'array':
        {
          const tpl = 'Prop.array().path("array").props(Prop.uuid())'
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - required`)
        }

        t.end()
        break
      case 'enum':
        {
          const tpl = `Prop.enum([1, 2]).path("${name}")`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - required`)
        }

        {
          const tpl = `Prop.enum(["1", "2"]).path("${name}").optional()`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - optional`)
        }

        {
          const tpl = `Prop.enum([]).path("${name}")`
          const prop = Prop.enum().path(name)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - required`)
        }
        t.end()
        break
      case 'ref':
        {
          const tpl = `Prop.ref("Visitor").path("${name}")`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - required`)
        }

        {
          const tpl = `Prop.ref("Visitor").path("${name}").optional()`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - optional`)
        }
        t.end()
        break
      case 'regex':
        {
          const tpl = `Prop.regex(/^\d+$/).path("${name}")`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - required`)
        }

        {
          const tpl = `Prop.regex(/^\d+$/).path("${name}").optional()`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - optional`)
        }
        t.end()
        break
      default:
        {
          const tpl = `Prop.${name}().path("${name}")`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - required`)
        }

        {
          const tpl = `Prop.${name}().path("${name}").optional()`
          const prop = eval(tpl)
          const str = prop.toString()
          t.equal(str, tpl, `${name} - optional`)
        }
        t.end()
        break
    }
  })
}

const types = [
  ['array', ['props']]
, ['boolean', []]
, ['date', []]
, ['email', ['allowName']]
, ['enum', ['values']]
, ['number', ['min', 'max']]
, ['regex', ['value']]
, ['string', ['min', 'max', 'len']]
, ['uuid', []]
, ['url', []]
, ['object', ['props', 'passthrough']]
, ['ref', ['multi']]
, ['ip', ['allowCIDR']]
]

for (const [type, methods] of types) {
  testBaseProp(type, methods)
  testBaseToString(type, methods)
}

test('Prop.fromConfig()', (t) => {
  t.throws(() => {
    Prop.fromConfig(null)
  }, /config must be an object/)

  t.throws(() => {
    Prop.fromConfig(true)
  }, /config must be an object/)

  t.throws(() => {
    Prop.fromConfig({})
  }, /type is required/)

  t.throws(() => {
    Prop.fromConfig({ type: 'this is not a valid type' })
  }, /invalid config type/)

  const configs = require('./fixture')
  const exp = require('./fixture-out')
  var idx = 0
  for (const config of configs) {
    const o = Prop.fromConfig(config).toJSON()
    t.deepEqual(o, Object.assign({
      allowNull: false
    , unique: null
    , required: true
    }, exp[idx++]))
  }
  t.end()
})

test('Prop.fromConfigList()', (t) => {
  const invalidInputs = [
    null
  , true
  , /a/
  , {}
  ]
  invalidInputs.forEach((invalid) => {
    t.throws(() => {
      Prop.fromConfigList(invalid)
    }, /props must be an array/)
  })

  const configs = require('./fixture')
  const exp = require('./fixture-out')

  const found = Prop.fromConfigList(configs).map((v) => {
    return v.toJSON()
  })

  const expected = exp.map((v) => {
    return Object.assign({
      allowNull: false
    , unique: null
    }, v)
  })

  t.same(found, expected)

  t.end()
})

test('Prop.string().{min(),max(),len()}', (t) => {
  t.throws(() => {
    Prop.string().min('1')
  }, /min must be a number/)

  t.throws(() => {
    Prop.string().min(-1)
  }, /min must be >= 0/)

  t.throws(() => {
    Prop.string().max('1')
  }, /max must be a number/)

  t.throws(() => {
    Prop.string().max(-1)
  }, /max must be >= 0/)

  t.throws(() => {
    Prop.string().min(1).max(1)
  }, /max must be > min property/)

  t.throws(() => {
    Prop.string().len('NOPE')
  }, /len must be a number/)

  t.throws(() => {
    Prop.string().len(0)
  }, /len must be > 0/)

  t.throws(() => {
    Prop.string().len(5).min(2)
  }, /len and min\/max are mutually exclusive/)

  t.throws(() => {
    Prop.string().len(5).max(20)
  }, /len and min\/max are mutually exclusive/)

  t.throws(() => {
    Prop.string().max(20).len(5)
  }, /len and min\/max are mutually exclusive/)

  t.throws(() => {
    Prop.string().min(2).len(5)
  }, /len and min\/max are mutually exclusive/)

  t.end()
})

test('Prop.number().{min(),max()}', (t) => {
  t.throws(() => {
    Prop.number().min('1')
  }, /min must be a number/)

  t.throws(() => {
    Prop.number().max('1')
  }, /max must be a number/)

  t.throws(() => {
    Prop.number().min(1).max(1)
  }, /max must be > min property/)

  t.end()
})

test('Validate methods', (t) => {
  const types = Prop._types
  const methods = Object.keys(Prop).filter((method) => {
    return !['fromConfig', 'isProp', 'fromConfigList'].includes(method)
  })

  for (const method of methods) {
    t.type(Prop[method], 'function')
  }

  methods.sort()
  types.sort()
  t.deepEqual(types, methods, 'all methods exist')
  t.end()
})

test('isProp', (t) => {
  for (const type of Prop._types) {
    const m = `Prop.isProp(Prop.${type}()) === true`
    t.equal(Prop.isProp(Prop[type]()), true, m)
  }

  t.end()
})

test('nested object properties', (t) => {
  const p = Prop.object().props([
    Prop.uuid().path('foo').required(true)
  , Prop.uuid().path('bar.baz').required(true)
  , Prop.uuid().path('bar.quux').required(false)
  ])

  const out = p.toJSON()
  t.equal(out.props.length, 2)
  t.equal(out.props[0].path, 'foo')
  t.equal(out.props[0].required, true)
  t.equal(out.props[1].path, 'bar')
  t.equal(out.props[1].props.length, 2)
  t.equal(out.props[1].required, true)
  t.equal(out.props[1].type, 'object')
  t.equal(out.props[1].props[0].path, 'baz')
  t.equal(out.props[1].props[0].required, true)
  t.equal(out.props[1].props[1].path, 'quux')
  t.equal(out.props[1].props[1].required, false)
  t.end()
})

test('nested object properties where subproperties are not required', (t) => {
  const p = Prop.object().props([
    Prop.uuid().path('foo').required(true)
  , Prop.uuid().path('bar.baz').required(false)
  , Prop.uuid().path('bar.quux').required(false)
  ])

  const out = p.toJSON()
  t.equal(out.props.length, 2)
  t.equal(out.props[0].path, 'foo')
  t.equal(out.props[0].required, true)
  t.equal(out.props[1].path, 'bar')
  t.equal(out.props[1].props.length, 2)
  t.equal(out.props[1].required, false)
  t.equal(out.props[1].type, 'object')
  t.equal(out.props[1].props[0].path, 'baz')
  t.equal(out.props[1].props[0].required, false)
  t.equal(out.props[1].props[1].path, 'quux')
  t.equal(out.props[1].props[1].required, false)
  t.end()
})

test('nested object properties with subproperties *and* their parent', (t) => {
  const p = Prop.object().props([
    Prop.uuid().path('foo').required(true)
  , Prop.object().path('bar').required(false)
  , Prop.uuid().path('bar.baz').required(false)
  , Prop.uuid().path('bar.quux').required(false)
  ])

  const out = p.toJSON()
  t.equal(out.props.length, 2)
  t.equal(out.props[0].path, 'foo')
  t.equal(out.props[0].required, true)
  t.equal(out.props[1].path, 'bar')
  t.equal(out.props[1].props.length, 2)
  t.equal(out.props[1].required, false)
  t.equal(out.props[1].type, 'object')
  t.equal(out.props[1].props[0].path, 'baz')
  t.equal(out.props[1].props[0].required, false)
  t.equal(out.props[1].props[1].path, 'quux')
  t.equal(out.props[1].props[1].required, false)
  t.end()
})

test('throws on encountering invalid paths', (t) => {
  t.throws(() => {
    Prop.object().path()
  }, /"path" must be a string, found undefined/)
  t.end()
})

test('throws on encountering invalid values fore enums', (t) => {
  t.throws(() => {
    Prop.enum().values([{}])
  }, /"values" must be an array of strings or numbers/)

  t.throws(() => {
    Prop.enum().values('xyz')
  }, /"values" must be an array of strings or numbers/)

  t.end()
})

test('throws on incomplete regular expressions', (t) => {
  t.throws(() => {
    Prop.regex().value(/\d+/)
  }, /expressions for Prop.regex\(\) need to start with \^ and end with \$/)

  t.throws(() => {
    Prop.regex().value(/^\d+/)
  }, /expressions for Prop.regex\(\) need to start with \^ and end with \$/)

  t.throws(() => {
    Prop.regex().value(/\d+$/)
  }, /expressions for Prop.regex\(\) need to start with \^ and end with \$/)

  t.throws(() => {
    Prop.regex(/\d+/)
  }, /expressions for Prop.regex\(\) need to start with \^ and end with \$/)

  t.end()
})
