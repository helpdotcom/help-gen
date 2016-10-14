'use strict'

const test = require('tap').test
const common = require('../common')
const getProp = common.getProp('enum', ['a', 'b', 'c'])
const getPropN = common.getProp('enum', [1, 2, 3])

function compile(props) {
  return common.compile({
    name: 'enum_type'
  , type: 'enum_type'
  , props: [props]
  })
}

const cases = new Set([
  getProp()
, getPropN()
, getProp().allowNull()
, getPropN().allowNull()
, getProp().optional()
, getPropN().optional()
, getProp().optional().allowNull()
, getPropN().optional().allowNull()
])

const ERROR_MESSAGE = /invalid param: "enum". Must be one of ["a", "b", "c"]/
const ERROR_MESSAGE_N = /invalid param: "enum". Must be one of [1, 2, 3]/

for (const prop of cases) {
  const fn = compile(prop)
  const name = prop.toString()
  test(name, (t) => {
    const ERROR = prop._values[0] === 'a'
      ? ERROR_MESSAGE
      : ERROR_MESSAGE_N
    if (prop._required) {
      t.test('missing prop fails', (tt) => {
        const valid = fn({}, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR)
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
          enum: null
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('null prop fails', (tt) => {
        const valid = fn({
          enum: null
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })
    }

    t.test('success', (tt) => {
      const valid = fn({
        enum: prop._values[0]
      }, (err, out) => {
        tt.error(err)
        tt.deepEqual(out, { enum: prop._values[0] })
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })

    t.end()
  })
}
