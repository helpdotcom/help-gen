'use strict'

const test = require('tap').test
const Validator = require('../').Validator
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
  }, /type is required and must be a string/)

  t.throws(() => {
    new Validator({ name: 'test', type: 'test' })
  }, /props is required and must be an array/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{}]
    })
  }, /type is required and must be a string/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{}]
    , type: 'test'
    })
  }, /Invalid prop. "type" must be a string/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.regex().path('a')]
    , type: 'test'
    })
  }, /"value" is required for "regex" type/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.enum().path('a')]
    , type: 'test'
    })
  }, /"values" is required for "enum" type/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{ type: 14, path: 't' }]
    , type: 'test'
    })
  }, /Invalid prop. "type" must be a string/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.uuid()]
    , type: 'test'
    })
  }, /Invalid prop. "path" must be a string/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [Prop.uuid().path({})]
    , type: 'test'
    })
  }, /Invalid prop. "path" must be a string/)

  t.end()
})
