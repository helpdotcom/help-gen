'use strict'

const test = require('tap').test
const generator = require('../lib/generate').generate
const utils = require('../lib/utils')
const build = require('../lib/build-default-obj')
const vm = require('vm')

function gen(a) {
  const code = generator(utils.objectExpression(a))
  const sandbox = {}
  vm.runInNewContext(`this.out = ${code}`, sandbox)
  return sandbox.out
}

test('works with array of strings', (t) => {
  const input = [
    'id'
  , 'name'
  , 'age'
  , 'user.email'
  , 'user.name'
  ]
  const out = build(input)
  const code = gen(out)
  t.deepEqual(code, {
    id: undefined
  , name: undefined
  , age: undefined
  , user: { email: undefined, name: undefined }
  })

  t.end()
})

test('works with array of objects', (t) => {
  const id = '73545F53-5A99-4279-92C5-40424B48A242'
  const input = [
    { path: 'id', example: id }
  , { path: 'test' }
  , { path: 'age', example: 24 }
  , { path: 'archived', example: false }
  , { path: 'roles', example: ['admin', 'user'] }
  , { path: 'biscuits', example: [{ name: 'test' }] }
  ]

  const out = build(input)
  const code = gen(out)
  t.deepEqual(code, {
    id: id
  , test: undefined
  , age: 24
  , archived: false
  , roles: ['admin', 'user']
  , biscuits: [{ name: 'test' }]
  })

  t.end()
})
