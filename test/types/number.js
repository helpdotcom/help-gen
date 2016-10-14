'use strict'

const test = require('tap').test
const common = require('../common')
const getProp = common.getProp('number')

function compile(props) {
  return common.compile({
    name: 'number_type'
  , type: 'number_type'
  , props: [props]
  })
}

const cases = new Set([
  getProp()
, getProp().min(1)
, getProp().max(10)
, getProp().min(1).max(10)
, getProp().allowNull()
, getProp().optional().min(1)
, getProp().optional().max(10)
, getProp().optional().min(1).max(10)
, getProp().optional().allowNull()
])

const ERROR_MESSAGE = /invalid param: "number". Expected number/
const MIN_ERROR = /invalid param: "number". Value must be >= 1, got 0/
const MAX_ERROR = /invalid param: "number". Value must be <= 10, got 50/

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
          number: null
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('null prop fails', (tt) => {
        const valid = fn({
          number: null
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR_MESSAGE)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })
    }

    if (typeof prop._min === 'number') {
      t.test('value is < min fails', (tt) => {
        const valid = fn({
          number: prop._min - 1
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, MIN_ERROR)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })

      t.test('length > min passes', (tt) => {
        const valid = fn({
          number: prop._min + 1
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('-50 passes', (tt) => {
        const valid = fn({
          number: -50
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    }

    if (typeof prop._max === 'number') {
      t.test('value is > max fails', (tt) => {
        const valid = fn({
          number: prop._max + 1
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, MAX_ERROR)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })

      t.test('length < max passes', (tt) => {
        const valid = fn({
          number: prop._max - 1
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('100000 passes', (tt) => {
        const valid = fn({
          number: 100000
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    }

    t.test('success', (tt) => {
      const valid = fn({
        number: 1
      }, (err, out) => {
        tt.error(err)
        tt.deepEqual(out, { number: 1 })
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })

    t.end()
  })
}
