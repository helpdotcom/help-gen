'use strict'

const test = require('tap').test
const common = require('../../common')

const getProp = common.getProp('email')

function compile(props) {
  return common.compileValidator({
    name: 'email_type'
  , type: 'email_type'
  , props: [props]
  })
}

const ERROR_MESSAGE = /invalid param: "email". Expected email/

const cases = new Set([
  getProp()
, getProp().allowNull()
, getProp().optional()
, getProp().optional().allowNull()
, getProp().allowName()
, getProp().allowName().allowNull()
, getProp().allowName().optional()
, getProp().allowName().optional().allowNull()
])

for (const prop of cases) {
  const fn = compile(prop)
  const name = prop.toString()

  test(name, (t) => {
    if (prop._required) {
      t.test('missing prop fails', (tt) => {
        const valid = fn({}, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR_MESSAGE)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })
    } else {
      t.test('missing prop passes', (tt) => {
        const valid = fn({}, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    }

    if (prop._allowNull) {
      t.test('null prop passes', (tt) => {
        const valid = fn({
          email: null
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('null prop fails', (tt) => {
        const valid = fn({
          email: null
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR_MESSAGE)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })
    }

    if (prop._allowName) {
      t.test('email with name passes', (tt) => {
        const valid = fn({
          email: 'Evan Lucas <evan.lucas@help.com>'
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('email with name fails', (tt) => {
        const valid = fn({
          email: 'Evan Lucas <evan.lucas@help.com>'
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR_MESSAGE)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })
    }

    t.end()
  })
}
