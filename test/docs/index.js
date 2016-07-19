'use strict'

const test = require('tap').test
const Docs = require('../../').docs
const fs = require('fs')
const path = require('path')
const fixtures = path.join(__dirname, '..', 'fixtures')
const Markdown = require('../../lib/docs/markdown')
const Section = require('../../lib/docs/section')

test('constructor', (t) => {
  t.throws(function() {
    Docs()
  }, /routes must be an Array/)

  t.throws(function() {
    Docs([])
  }, /opts.title is required/)

  let docs = new Docs([], {
    title: 'Test'
  })

  t.equal(docs.routes.length, 1)
  t.equal(docs.title, 'Test')
  t.ok(docs.hasOwnProperty('slugger'))
  t.ok(docs.hasOwnProperty('template'))

  docs = new Docs([], {
    title: 'Test'
  , toc: false
  })
  t.equal(docs.opts.toc, false)

  t.throws(function() {
    new Markdown()
  }, /section must be a Section/)

  t.end()
})

const resId = '5eae86ea-1913-49cd-b7d1-c7e28d0197e6'
const routes = [
  { method: 'GET'
  , path: '/organization'
  , input: [
      { type: 'uuid'
      , path: 'id'
      , description: 'id'
      }
    , { type: 'enum'
      , values: ['admin', 'manager', 'agent']
      , path: 'role'
      , description: 'The user\'s role'
      }
    ]
  , inputNote: 'Input Note'
  , output: [ [ { type: 'uuid', path: 'id', example: resId } ] ]
  , outputNote: 'Output Note'
  , title: 'List Organzations'
  , description: 'Gets all organizations'
  }
, { method: 'POST'
  , path: '/organization'
  , input: [ { type: 'uuid', path: 'id', description: 'id' } ]
  , inputNote: 'Input Note'
  , output: [ { type: 'uuid', path: 'id', example: resId }]
  , outputNote: 'Output Note'
  , title: 'Create organization'
  , description: 'Gets all organizations'
  }
, { method: 'POST'
  , path: '/department'
  , output: [ { type: 'uuid', path: 'id', example: resId }]
  , outputNote: 'Output Note'
  , title: 'Create Department'
  , description: 'Creates a department'
  }
]

function fixture(fp) {
  return fs.readFileSync(path.join(fixtures, fp), 'utf8').trim()
}

test('render', (t) => {
  const docs0 = new Docs(routes, {
    title: 'Test'
  , config: [
      { name: 'loglevel'
      , default: 'info'
      , type: 'STRING'
      , required: false
      , env: 'LOGLEVEL'
      }
    , { name: 'port'
      , default: 8088
      , type: 'NUMBER'
      , required: false
      , env: 'PORT'
      }
    ]
  })

  const docs1 = new Docs(routes, {
    title: 'Test'
  , config: [
      { name: 'loglevel'
      , default: 'info'
      , type: 'STRING'
      , required: false
      , env: 'LOGLEVEL'
      }
    ]
  })

  t.throws(function() {
    docs0.render('biscuits')
  }, /Invalid format: biscuits/)

  // test with port
  let md0 = docs0.render('markdown').trim()
  t.equal(md0, fixture('doc-md.txt'))

  let json0 = JSON.parse(docs0.render('json').trim())
  t.deepEqual(json0, require('../fixtures/doc-json.json'))

  let html0 = docs0.render('html').trim()
  t.equal(html0, fixture('doc-html.txt'))

  // test without port
  let md1 = docs1.render('markdown').trim()
  t.equal(md1, fixture('doc-md-sans-port.txt'))

  let json1 = JSON.parse(docs1.render('json').trim())
  t.deepEqual(json1, require('../fixtures/doc-json-sans-port.json'))

  let html1 = docs1.render('html').trim()
  t.equal(html1, fixture('doc-html-sans-port.txt'))

  t.end()
})

test('render with array output', (t) => {
  const r = [
    { method: 'GET'
    , path: '/'
    , fn: () => {}
    , output: [require('../fixtures/array_docs.json').properties]
    , title: 'List'
    , description: 'Lists members'
    }
  ]
  const docs = new Docs(r, {
    title: 'Test'
  })

  const out = JSON.parse(docs.render('json'))
  t.deepEqual(out.routes[0].response, [
    [
      { type: 'uuid'
      , path: 'id'
      , example: '23EBEABD-CF0A-4FFF-BF7B-243F35D1CB2F'
      }
    , { type: 'email', path: 'email', example: 'help@help.com' }
    , { type: 'string', path: 'name', example: 'Jon Doe' }
    , { type: 'string'
      , path: 'display_name'
      , example: 'Jon'
      }
    , { type: 'array', path: 'roles', example: ['admin'] }
    ]
  ])
  t.end()
})

test('render without output', (t) => {
  const r = routes.map((item) => {
    const o = Object.assign({}, item)
    delete o.output
    return o
  })
  const docs = new Docs(r, {
    title: 'Test'
  , config: [
      { name: 'loglevel'
      , default: 'info'
      , type: 'STRING'
      , required: false
      , env: 'LOGLEVEL'
      }
    , { name: 'port'
      , default: 8088
      , type: 'NUMBER'
      , required: false
      , env: 'PORT'
      }
    ]
  })

  const json = JSON.parse(docs.render('json').trim())
  t.deepEqual(json, require('../fixtures/doc2-json.json'))
  t.end()
})

test('curl with GET', (t) => {
  const r = routes.map((item) => {
    const o = Object.assign({}, item)
    delete o.output
    return o
  })
  const docs = new Docs(r, {
    title: 'Test'
  , config: [
      { name: 'loglevel'
      , default: 'info'
      , type: 'STRING'
      , required: false
      , env: 'LOGLEVEL'
      }
    , { name: 'port'
      , default: 8088
      , type: 'NUMBER'
      , required: false
      , env: 'PORT'
      }
    ]
  })
  const section0 = new Section(routes[0], docs)
  const s0 = section0._curl()
  const result0 = [
    'curl -s -H \'Content-type: application/json\''
  , '-H \'Accept: application/json\' http://localhost:8088/organization'
  ].join(' ')
  t.equal(s0, result0)

  const section1 = new Section(routes[1], docs)
  const s1 = section1._curl()
  const result1 = [
    'curl -s -H \'Content-type: application/json\' ',
  , '-H \'Accept: application/json\' http://localhost:8088/organization '
  , '-X POST -d \'{"id":"885b440b-8b0e-445c-bd0f-b212ad0fdc41"}\''
  ].join('')
  t.equal(s1, result1)

  t.end()
})
