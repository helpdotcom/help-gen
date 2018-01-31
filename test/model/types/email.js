'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getNestedProp('email')
const getTestName = common.getTestName

const NESTED_ERROR = /invalid property: "nested". Expected object/
const ERROR = /invalid property: "nested.email". Expected email/

const cases = new Set([
  getProp()
, getProp().allowNull()
, getProp().optional()
, getProp().optional().allowNull()
])

test('Model - Prop.email()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'EmailType'
    , type: 'email_type'
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
            new fn({ nested: { email: null } })._validate()
          })

          {
            const model = new fn({ nested: { email: null } })
            ttt.equal(model.nested.email, null, 'model.nested.email')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                email: null
              }
            }, 'toJSON()')
          }

          {
            const re = 'evan.lucas@help.com'
            const model = new fn({ nested: { email: re } })
            ttt.equal(model.nested.email, re, 'model.nested.email')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                email: re
              }
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ nested: { email: null } })
          }, ERROR)
          ttt.end()
        })
      }

      tt.end()
    })
  }

  t.end()
})
