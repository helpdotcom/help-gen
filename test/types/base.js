'use strict'

const test = require('tap').test
const common = require('../common')

// These all currently use the same code path, so we can group them together
const TESTS = new Set([
  'boolean'
, 'date'
, 'email'
, 'uuid'
])

for (const type of TESTS) {
  const getProp = common.getProp(type)
  const ERROR_MESSAGE = new RegExp(`invalid param: "${type}. Expected ${type}"`)
  function compile(props) {
    return common.compile({
      name: `${type}_type`
    , type: `${type}_type`
    , props: [props]
    })
  }

  const cases = new Set([
    getProp()
  , getProp().allowNull()
  , getProp().optional()
  , getProp().allowNull().optional()
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
            [type]: null
          }, (err) => {
            tt.error(err)
            tt.equal(valid, true, 'returns true')
            tt.end()
          })
        })
      } else {
        t.test('null prop fails', (tt) => {
          const valid = fn({
            [type]: null
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
}
