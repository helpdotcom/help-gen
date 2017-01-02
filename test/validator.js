'use strict'

const test = require('tap').test
const Validator = require('../').Validator

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
  }, /type is required/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{ type: 14, path: 't' }]
    , type: 'test'
    })
  }, /invalid config type: "14"/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{ type: 'string' }]
    , type: 'test'
    , failOnExtraneousProperties: true
    , stripExtraneousProperties: true
    }).generate()
  }, /Stripping and failing on extraneous properties are mutually exclusive/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{ type: 'string' }]
    , type: 'test'
    , synchronousReturn: 'foobar'
    }).generate()
  }, /synchronousReturn is required and must be a boolean/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{ type: 'string' }]
    , type: 'test'
    , resultVar: 1
    }).generate()
  }, /resultVar is optional but must be a string/)

  t.throws(() => {
    new Validator({
      name: 'test'
    , props: [{ type: 'string' }]
    , type: 'test'
    , inputVar: 1
    }).generate()
  }, /inputVar is optional but must be a string/)

  t.end()
})

