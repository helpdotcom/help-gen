'use strict'

const test = require('tap').test
const Validator = require('../lib/validator')
const Prop = require('@helpdotcom/nano-prop')

test('Validator', (t) => {

  // classes are non-callable (i.e., they require `new`)
  t.throws(() => {
    Validator()
  })

  t.throws(() => {
    new Validator()
  }, /name is required/)

  t.throws(() => {
    new Validator({
      name: 'fasdf fasdfd asdfadsf'
    }, /must be a string that is a valid identifier/)
  })

  t.throws(() => {
    new Validator({ name: 'test' })
  }, /props is required and must be an Array/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{}]
    })
  }, /Invalid config. `type` \(string\) is required/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{}]
    , type: {}
    })
  }, /Invalid config. `type` \(string\) is required/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{}]
    , type: 'test'
    })
  }, /Invalid rule. `type` is required/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.regex().path('a')]
    , type: 'test'
    })
  }, /value must be defined for type: regex/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.enum().path('a')]
    , type: 'test'
    })
  }, /values must be defined for type: enum/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{ type: 14, path: 't' }]
    , type: 'test'
    })
  }, /Invalid rule. `type` must be a string/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.uuid()]
    , type: 'test'
    })
  }, /Invalid rule. `path` is required/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.uuid().path({})]
    , type: 'test'
    })
  }, /Invalid rule. `path` must be a string/)

  t.end()
})
