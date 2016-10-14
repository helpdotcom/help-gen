'use strict'

const test = require('tap').test
const transform = require('../lib/transform-props')
const utils = require('../lib/utils')
const Prop = require('@helpdotcom/nano-prop')

const tests = [
  { name: 'no props', input: [], output: [], deps: { has: false, is: false } }
, { name: 'top level props all required'
  , input: [
      Prop.boolean().path('bool')
    , Prop.email().path('email')
    , Prop.string().path('string')
    , Prop.enum(['a', 'b']).path('enuma')
    , Prop.uuid().path('uuid')
    , Prop.number().path('number')
    , Prop.regex(/\w/).path('regex')
    , Prop.date().path('date')
    ]
  , output: [
      Prop.boolean().path('bool')
    , Prop.date().path('date')
    , Prop.email().path('email')
    , Prop.enum(['a', 'b']).path('enuma')
    , Prop.number().path('number')
    , Prop.regex(/\w/).path('regex')
    , Prop.string().path('string')
    , Prop.uuid().path('uuid')
    ].map((i) => { return formatProp(i) })
  , deps: { has: false, is: true }
  }
, { name: 'top level props none required'
  , input: [
      Prop.boolean().path('bool').optional()
    , Prop.email().path('email').optional()
    , Prop.string().path('string').optional()
    , Prop.enum(['a', 'b']).path('enuma').optional()
    , Prop.uuid().path('uuid').optional()
    , Prop.number().path('number').optional()
    , Prop.regex(/\w/).path('regex').optional()
    , Prop.date().path('date').optional()
    ]
  , output: [
      Prop.boolean().path('bool').optional()
    , Prop.date().path('date').optional()
    , Prop.email().path('email').optional()
    , Prop.enum(['a', 'b']).path('enuma').optional()
    , Prop.number().path('number').optional()
    , Prop.regex(/\w/).path('regex').optional()
    , Prop.string().path('string').optional()
    , Prop.uuid().path('uuid').optional()
    ].map((i) => { return formatProp(i) })
  , deps: { has: true, is: true }
  }
, { name: 'required nested props - 1 level'
  , input: [
      getString('admin.name', true)
    ]
  , output: [
      Object.assign(getObject('admin', true), {
        children: [
          formatProp(getString('admin.name', true), [])
        ]
      })
    ]
  , deps: { has: false, is: false }
  }
, { name: 'required nested props - 2 levels'
  , input: [
      getString('admin.organization.id', true)
    ]
  , output: [
      Object.assign(getObject('admin', true), {
        children: [
          Object.assign(getObject('admin.organization', true), {
            children: [
              formatProp(getString('admin.organization.id', true), [])
            ]
          })
        ]
      })
    ]
  , deps: { has: false, is: false }
  }
, { name: 'optional and required nested props - 1 level'
  , input: [
      getString('admin.name', true)
    , getString('admin.email', false)
    ]
  , output: [
      Object.assign(getObject('admin', true), {
        children: [
          formatProp(getString('admin.name', true), [])
        , formatProp(getString('admin.email', false), [])
        ]
      })
    ]
  , deps: { has: true, is: false }
  }
, { name: 'arrays'
  , input: [
      Prop
        .array()
        .path('members')
    ]
  , output: [
      Object.assign(Prop.array().path('members').toJSON(), {
        children: []
      })
    ]
  , deps: { has: false, is: false }
  }
, { name: 'arrays with nested primitive'
  , input: [
      Prop
        .array()
        .path('members')
        .props(Prop.uuid())
    ]
  , output: [
      Object.assign(Prop.array().path('members').toJSON(), {
        children: [
          Object.assign(Prop.uuid().path('members.^__IDX__1').toJSON(), {
            children: []
          })
        ]
      })
    ]
  , deps: { has: false, is: true }
  }
]

for (const item of tests) {
  test(`transformProps - ${item.name}`, (t) => {
    const out = transform(item.input)
    if (item.deps) item.output.deps = item.deps
    t.deepEqual(out, item.output)
    t.end()
  })
}

function formatProp(p, kids) {
  const out = utils.propToJSON(p)
  out.children = kids || []
  return out
}

function getObject(path, req) {
  return {
    type: 'object'
  , path: path
  , required: req
  }
}

function getString(path, req) {
  return Prop.string().path(path).required(req)
}
