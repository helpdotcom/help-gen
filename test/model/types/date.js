'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getNestedProp('date')
const getTestName = common.getTestName

const NESTED_ERROR = /invalid property: "nested". Expected object/
const ERROR = /invalid property: "nested.date". Expected date/

const cases = new Set([
  getProp()
, getProp().allowNull()
, getProp().optional()
, getProp().optional().allowNull()
])

test('Model - Prop.date()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'DateType'
    , type: 'date_type'
    , props: [prop]
    })
    const name = getTestName(prop)
    t.test(name, (tt) => {
      if (prop._required) {
        tt.test('missing prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({})
          }, NESTED_ERROR)
          ttt.end()
        })
      } else {
        tt.test('missing prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({})._validate()
          })

          const model = new fn({})
          ttt.deepEqual(model.toJSON(), {
            nested: null
          }, 'toJSON()')
          ttt.end()
        })
      }

      if (prop._allowNull) {
        tt.test('null prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ nested: { date: null } })._validate()
          })

          {
            const model = new fn({ nested: { date: null } })
            ttt.equal(model.nested.date, null, 'model.nested.date')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                date: null
              }
            }, 'toJSON()')
          }

          {
            const re = new Date().toISOString()
            const model = new fn({ nested: { date: re } })
            ttt.equal(model.nested.date, re, 'model.nested.date')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                date: re
              }
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ nested: { date: null } })
          }, ERROR)
          ttt.end()
        })
      }

      tt.end()
    })
  }

  t.end()
})
