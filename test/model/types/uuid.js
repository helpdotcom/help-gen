'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getProp('uuid')
const getTestName = common.getTestName

const ERROR = /invalid property: "uuid". Expected uuid/

const cases = new Set([
  getProp()
, getProp().allowNull()
, getProp().optional()
, getProp().optional().allowNull()
])

test('Model - Prop.uuid()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'UUIDType'
    , type: 'uuid_type'
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
            uuid: null
          }, 'toJSON()')
          ttt.end()
        })
      }

      if (prop._allowNull) {
        tt.test('null prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ uuid: null })._validate()
          })

          {
            const model = new fn({ uuid: null })
            ttt.equal(model.uuid, null, 'model.uuid')
            ttt.deepEqual(model.toJSON(), {
              uuid: null
            }, 'toJSON()')
          }

          {
            const uuid = 'C7643BEC-81EC-46F3-843B-BE1758865091'
            const model = new fn({ uuid: uuid })
            ttt.equal(model.uuid, uuid, 'model.uuid')
            ttt.deepEqual(model.toJSON(), {
              uuid: uuid
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ uuid: null })
          }, ERROR)
          ttt.end()
        })
      }

      tt.end()
    })
  }

  t.end()
})
