'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getProp('number')
const getTestName = common.getTestName

const ERROR = /invalid property: "number". Expected number/
const MIN_ERROR = /invalid property: "number". Value must be >= 1, got 0/
const MAX_ERROR = /invalid property: "number". Value must be <= 10, got 50/

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

test('Model - Prop.number()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'NumberType'
    , type: 'number_type'
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
            number: undefined
          }, 'toJSON()')
          ttt.end()
        })
      }

      if (prop._allowNull) {
        tt.test('null prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ number: null })._validate()
          })

          {
            const model = new fn({ number: null })
            ttt.equal(model.number, null, 'model.number')
            ttt.deepEqual(model.toJSON(), {
              number: null
            }, 'toJSON()')
          }

          {
            const model = new fn({ number: 1 })
            ttt.equal(model.number, 1, 'model.number')
            ttt.deepEqual(model.toJSON(), {
              number: 1
            }, 'toJSON()')
          }

          {
            const model = new fn({ number: 2 })
            ttt.equal(model.number, 2, 'model.number')
            ttt.deepEqual(model.toJSON(), {
              number: 2
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ number: null })
          }, ERROR)
          ttt.end()
        })
      }

      if (typeof prop._min === 'number') {
        tt.test('value is < min fails', (ttt) => {
          ttt.throws(() => {
            new fn({ number: 0 })
          }, MIN_ERROR)

          ttt.end()
        })

        tt.test('length > min passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ number: 1 })
          })

          {
            const model = new fn({ number: 1 })
            ttt.equal(model.number, 1, 'model.number')
            ttt.deepEqual(model.toJSON(), {
              number: 1
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('0 passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ number: 0 })
          })

          ttt.end()
        })
      }

      if (typeof prop._max === 'number') {
        tt.test('value is > max fails', (ttt) => {
          ttt.throws(() => {
            new fn({ number: 50 })
          }, MAX_ERROR)

          ttt.end()
        })

        tt.test('length < max passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ number: 9 })
          })

          {
            const model = new fn({ number: 9 })
            ttt.equal(model.number, 9, 'model.number')
            ttt.deepEqual(model.toJSON(), {
              number: 9
            }, 'toJSON()')
          }

          ttt.end()
        })
      } else {
        tt.test('100 passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ number: 100 })
          })

          ttt.end()
        })
      }

      tt.end()
    })
  }

  t.end()
})
