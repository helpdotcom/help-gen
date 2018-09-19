'use strict'

const test = require('tap').test
const common = require('../../common')
const getProp = common.getProp('regex', /^\w+$/)

function compile(props) {
  return common.compileValidator({
    name: 'regex_type'
  , type: 'regex_type'
  , props: [props]
  })
}

const cases = new Set([
  getProp()
, getProp().allowNull()
, getProp().optional()
, getProp().optional().allowNull()
])

const ERROR_MESSAGE = /invalid param: "regex". Must match \/\^\\w\+\$\//

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
          regex: null
        }, (err) => {
          tt.error(err)
          tt.equal(valid, true, 'returns true')
          tt.end()
        })
      })
    } else {
      t.test('null prop fails', (tt) => {
        const valid = fn({
          regex: null
        }, (err) => {
          tt.type(err, Error)
          tt.match(err, ERROR_MESSAGE)
          tt.equal(valid, false, 'returns false')
          tt.end()
        })
      })
    }

    t.test('success', (tt) => {
      const valid = fn({
        regex: 's'
      }, (err, out) => {
        tt.error(err)
        tt.deepEqual(out, { regex: 's' })
        tt.equal(valid, true, 'returns true')
        tt.end()
      })
    })

    t.end()
  })
}
