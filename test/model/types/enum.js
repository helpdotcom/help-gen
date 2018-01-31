'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getNestedProp('enum', ['a', 'b', 'c'])
const getPropN = common.getNestedProp('enum', [1, 2, 3])
const getTestName = common.getTestName

const NESTED_ERROR = /invalid property: "nested". Expected object/
const ERROR = /invalid property: "nested.enum". Must be one of/

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

test('Model - Prop.regex()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'EnumType'
    , type: 'enum_type'
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

      tt.test('invalid value', (ttt) => {
        ttt.throws(() => {
          new fn({ nested: { enum: 'd' } })._validate()
        }, ERROR)

        ttt.end()
      })

      if (prop._allowNull) {
        tt.test('null prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ nested: { enum: null } })._validate()
          })

          {
            const model = new fn({ nested: { enum: null } })
            ttt.equal(model.nested.enum, null, 'model.nested.enum')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                enum: null
              }
            }, 'toJSON()')
          }

          for (const val of prop._values) {
            const model = new fn({ nested: { enum: val } })
            ttt.equal(model.nested.enum, val, 'model.nested.enum')
            ttt.deepEqual(model.toJSON(), {
              nested: {
                enum: val
              }
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ nested: { enum: null } })
          }, ERROR)
          ttt.end()
        })
      }

      tt.end()
    })
  }

  t.end()
})
