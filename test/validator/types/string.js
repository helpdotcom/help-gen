'use strict'

const test = require('tap').test
const common = require('../../common')
const getProp = common.getProp('string')

function compile(props) {
  return common.compileValidator({
    name: 'string_type'
  , type: 'string_type'
  , props: [props]
  })
}

const cases = new Set([
  getProp()
, getProp().min(1)
, getProp().max(10)
, getProp().min(1).max(10)
, getProp().allowNull()
, getProp().optional()
, getProp().optional().min(1)
, getProp().optional().max(10)
, getProp().optional().min(1).max(10)
, getProp().optional().allowNull()
])

const ERROR_MESSAGE = /invalid param: "string". Expected string/
const MIN_ERROR = /invalid param: "string". Length must be >= 1, got 0/
const MAX_ERROR = /invalid param: "string". Length must be <= 10, got 50/

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
          string: null
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('null prop fails', (tt) => {
        const valid = fn({
          string: null
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR_MESSAGE)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })
    }

    if (typeof prop._min === 'number') {
      t.test('length is < min fails', (tt) => {
        const valid = fn({
          string: ''
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, MIN_ERROR)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })

      t.test('length > min passes', (tt) => {
        const valid = fn({
          string: 'a'.repeat(5)
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('empty string passes', (tt) => {
        const valid = fn({
          string: ''
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    }

    if (typeof prop._max === 'number') {
      t.test('length is > max fails', (tt) => {
        const valid = fn({
          string: 'a'.repeat(50)
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, MAX_ERROR)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })

      t.test('length < max passes', (tt) => {
        const valid = fn({
          string: 'a'.repeat(10)
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      const str = 'a'.repeat(60)
      t.test(`"${str}" passes`, (tt) => {
        const valid = fn({
          string: str
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    }

    t.test('success', (tt) => {
      const valid = fn({
        string: 'abcd'
      }, (err, out) => {
        tt.error(err)
        tt.deepEqual(out, { string: 'abcd' })
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })

    t.end()
  })
}
