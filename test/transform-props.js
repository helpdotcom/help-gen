'use strict'

const test = require('tap').test
const transform = require('../lib/transform-props')
const Prop = require('@helpdotcom/nano-prop')

const tests = [
  { name: 'no props', input: [], output: [] }
, { name: 'top level props all required'
  , input: [
      Prop.boolean().path('bool').required(true)
    , Prop.email().path('email').required(true)
    , Prop.string().path('string').required(true)
    , Prop.enum(['a', 'b']).path('enuma').required(true)
    , Prop.uuid().path('uuid').required(true)
    , Prop.number().path('number').required(true)
    , Prop.regex(/\w/).path('regex').required(true)
    , Prop.date().path('date').required(true)
    ]
  , output: [
      Prop.boolean().path('bool').required(true)
    , Prop.date().path('date').required(true)
    , Prop.email().path('email').required(true)
    , Prop.enum(['a', 'b']).path('enuma').required(true)
    , Prop.number().path('number').required(true)
    , Prop.regex(/\w/).path('regex').required(true)
    , Prop.string().path('string').required(true)
    , Prop.uuid().path('uuid').required(true)
    ].map((i) => { return formatProp(i) })
  }
, { name: 'top level props none required'
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
  }
, { name: 'optional and required nested props - 1 level'
  , input: [
      getString('admin.name', true)
    , getString('admin.email', false)
    ]
  , output: [
      Object.assign(getObject('admin', true), {
        children: [
          formatProp(getString('admin.email', false), [])
        , formatProp(getString('admin.name', true), [])
        ]
      })
    ]
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
  }
, { name: 'arrays'
  , input: [
      Prop
        .array()
        .path('members')
        .props(Prop.uuid())
    ]
  , output: [
      Object.assign(Prop.array().path('members').toJSON(), {
        children: []
      , props: Prop.uuid().required(true)
      })
    ]
  }
]

for (const item of tests) {
  test(`transformProps - ${item.name}`, (t) => {
    const out = transform(item.input)
    t.deepEqual(out, item.output)
    t.end()
  })
}

function formatProp(p, kids) {
  const out = p.toJSON()
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
