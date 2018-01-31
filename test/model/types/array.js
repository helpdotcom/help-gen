'use strict'

const Prop = require('@helpdotcom/nano-prop')
const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getNestedProp('array')
const getTestName = common.getTestName

const NESTED_ERROR = /invalid property: "nested". Expected object/
const ARRAY_ERROR = /invalid property: "nested.array". Expected array/
const UUID_ERROR = /invalid property: "nested.array\[i\]". Expected uuid/
const OBJECT_ERROR = /invalid property: "nested.array\[i\]". Expected object/

const cases = new Set([
  getProp()
, getProp().allowNull().props(Prop.uuid())
, getProp().props(Prop.uuid())
, getProp().optional()
, getProp().props(Prop.uuid()).optional()
, getProp().props(Prop.object().passthrough())
])

test('Model - Prop.array()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'ArrayType'
    , type: 'array_type'
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
            new fn({})._validate().toJSON()
          })

          ttt.doesNotThrow(() => {
            new fn({
              nested: undefined
            })._validate().toJSON()
          })

          ttt.end()
        })
      }

      if (prop._allowNull) {
        tt.test('null prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ nested: { array: null } })._validate()
          })

          const model = new fn({ nested: { array: null } })
          ttt.equal(model.nested.array, null, 'model.array')
          ttt.deepEqual(model.toJSON(), {
            nested: {
              array: null
            }
          }, 'toJSON()')

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ nested: { array: null } })
          }, ARRAY_ERROR)
          ttt.end()
        })
      }

      if (prop._props) {
        if (prop._props._type === 'uuid') {
          tt.test('fails if invalid array item', (ttt) => {
            ttt.throws(() => {
              new fn({ nested: { array: ['abcd'] } })
            }, UUID_ERROR)
            ttt.end()
          })

          tt.test('valid values pass', (ttt) => {
            const opts = {
              nested: {
                array: ['39c9a02d-e9de-4220-a960-1617df64de41']
              }
            }

            const model = new fn(opts)

            ttt.doesNotThrow(() => {
              model._validate()
              model.toJSON()
            })

            ttt.deepEqual(model.toJSON(), opts)
            ttt.end()
          })
        } else if (prop._props._type === 'object') {
          tt.test('fails if invalid array item', (ttt) => {
            ttt.throws(() => {
              new fn({ nested: { array: ['abcd'] } })
            }, OBJECT_ERROR)
            ttt.end()
          })

          tt.test('valid values pass', (ttt) => {
            const opts = {
              nested: {
                array: [{}]
              }
            }

            const model = new fn(opts)

            ttt.doesNotThrow(() => {
              model._validate()
              model.toJSON()
            })

            ttt.deepEqual(model.toJSON(), opts)
            ttt.end()
          })
        }
      } else {
        tt.test('no props', (ttt) => {
          const opts = {
            nested: {
              array: [
                { a: 1, b: 2 }
              ]
            }
          }

          const model = new fn(opts)
          ttt.doesNotThrow(() => {
            model._validate()
            model.toJSON()
          })

          ttt.deepEqual(model.toJSON(), opts)
          ttt.end()
        })
      }
      tt.end()
    })
  }

  t.end()
})
