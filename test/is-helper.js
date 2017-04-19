'use strict'

const test = require('tap').test
const gen = require('../lib/to-code')
const is = require('../lib/is-helper')

test('isDate', (t) => {
  let varName = 'obj.createdAt'
  let exp = 'validators.isDate(obj.createdAt)'
  t.equal(gen(is.isDate(varName)), exp)

  varName = 'obj'
  exp = 'validators.isDate(obj)'
  t.equal(gen(is.isDate(varName)), exp)
  t.end()
})

test('isEmail', (t) => {
  let varName = 'obj.email'
  let exp = 'validators.isEmail(obj.email)'
  t.equal(gen(is.isEmail(varName)), exp)

  varName = 'obj'
  exp = 'validators.isEmail(obj)'
  t.equal(gen(is.isEmail(varName)), exp)
  t.end()
})

test('isUUID', (t) => {
  let varName = 'obj.id'
  let exp = 'validators.isUUID(obj.id)'
  t.equal(gen(is.isUUID(varName)), exp)

  varName = 'obj'
  exp = 'validators.isUUID(obj)'
  t.equal(gen(is.isUUID(varName)), exp)
  t.end()
})

test('isUrl', (t) => {
  let varName = 'obj.url'
  let exp = 'validators.isUrl(obj.url)'
  t.equal(gen(is.isUrl(varName)), exp)

  varName = 'obj'
  exp = 'validators.isUrl(obj)'
  t.equal(gen(is.isUrl(varName)), exp)
  t.end()
})
