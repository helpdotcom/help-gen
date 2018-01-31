'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getProp('regex', /^\d+$/)
const getTestName = common.getTestName

const ERROR = /invalid property: "regex". Must match/

const cases = new Set([
  getProp()
, getProp().allowNull()
, getProp().optional()
, getProp().optional().allowNull()
])

test('Model - Prop.regex()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'RegExpType'
    , type: 'regexp_type'
    , props: [prop]
    })
    const name = getTestName(prop)
    t.test(name, (tt) => {
      if (prop._required) {
        tt.test('missing prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({})
          }, ERROR)
          ttt.end()
        })
      } else {
        tt.test('missing prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({})._validate()
          })

          const model = new fn({})
          ttt.deepEqual(model.toJSON(), {
            regex: null
          }, 'toJSON()')
          ttt.end()
        })
      }

      if (prop._allowNull) {
        tt.test('null prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ regex: null })._validate()
          })

          {
            const model = new fn({ regex: null })
            ttt.equal(model.regex, null, 'model.reregex')
            ttt.deepEqual(model.toJSON(), {
              regex: null
            }, 'toJSON()')
          }

          {
            const re = 1
            const model = new fn({ regex: re })
            ttt.equal(model.regex, re, 'model.regex')
            ttt.deepEqual(model.toJSON(), {
              regex: re
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ regex: null })
          }, ERROR)
          ttt.end()
        })
      }

      tt.end()
    })
  }

  t.end()
})
