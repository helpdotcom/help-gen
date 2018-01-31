'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getNestedProp('boolean')
const getTestName = common.getTestName

const NESTED_ERROR = /invalid property: "nested". Expected object/
const ERROR = /invalid property: "nested.boolean". Expected boolean/

const cases = new Set([
  getProp()
, getProp().allowNull()
, getProp().optional()
, getProp().optional().allowNull()
])

test('Model - Prop.boolean()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'BooleanType'
    , type: 'boolean_type'
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
            new fn({ nested: { boolean: null } })._validate()
          })

          {
            const model = new fn({ nested: { boolean: null } })
            ttt.equal(model.nested.boolean, null, 'model.nested.boolean')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                boolean: null
              }
            }, 'toJSON()')
          }

          {
            const model = new fn({ nested: { boolean: true } })
            ttt.equal(model.nested.boolean, true, 'model.nested.boolean')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                boolean: true
              }
            }, 'toJSON()')
          }

          {
            const model = new fn({ nested: { boolean: false } })
            ttt.equal(model.nested.boolean, false, 'model.nested.boolean')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                boolean: false
              }
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ nested: { boolean: null } })
          }, ERROR)
          ttt.end()
        })
      }

      tt.end()
    })
  }

  t.end()
})
