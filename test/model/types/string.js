'use strict'

const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager
const getProp = common.getProp('string')
const getTestName = common.getTestName

const ERROR = /invalid property: "string". Expected string/
const MIN_ERROR = /invalid property: "string". Length must be >= 1, got 0/
const MAX_ERROR = /invalid property: "string". Length must be <= 10, got 50/

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

test('Model - Prop.string()', (t) => {
  for (const prop of cases) {
    const fn = compile({
      name: 'StringType'
    , type: 'string_tyoe'
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
            new fn({})
          })

          const model = new fn({})
          ttt.deepEqual(model.toJSON(), {
            string: null
          }, 'toJSON()')
          ttt.end()
        })
      }

      if (prop._allowNull) {
        tt.test('null prop passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ string: null })
          })

          const model = new fn({ string: null })
          ttt.equal(model.string, null, 'model.string')
          ttt.deepEqual(model.toJSON(), {
            string: null
          }, 'toJSON()')
          ttt.end()
        })
      } else {
        tt.test('null prop fails', (ttt) => {
          ttt.throws(() => {
            new fn({ string: null })
          }, ERROR)
          ttt.end()
        })
      }

      if (typeof prop._min === 'number') {
        tt.test('length is < min fails', (ttt) => {
          ttt.throws(() => {
            new fn({ string: '' })
          }, MIN_ERROR)

          ttt.end()
        })

        tt.test('length > min passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ string: 'abcd' })._validate()
          })

          const model = new fn({ string: 'abcd' })
          ttt.equal(model.string, 'abcd', 'model.string')
          ttt.deepEqual(model.toJSON(), {
            string: 'abcd'
          }, 'toJSON()')

          ttt.end()
        })
      } else {
        tt.test('empty passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ string: '' })._validate()
          })

          const model = new fn({ string: '' })
          ttt.equal(model.string, '', 'model.string')
          ttt.deepEqual(model.toJSON(), {
            string: ''
          }, 'toJSON()')

          ttt.end()
        })
      }

      if (typeof prop._max === 'number') {
        tt.test('length is > max fails', (ttt) => {
          ttt.throws(() => {
            new fn({ string: 'a'.repeat(50) })
          }, MAX_ERROR)
          ttt.end()
        })

        tt.test('length is <= max passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ string: 'a'.repeat(10) })._validate()
          })

          const model = new fn({ string: 'a'.repeat(10) })
          ttt.equal(model.string, 'a'.repeat(10), 'model.string')
          ttt.deepEqual(model.toJSON(), {
            string: 'a'.repeat(10)
          }, 'toJSON()')
          ttt.end()
        })
      } else {
        tt.test('long string passes', (ttt) => {
          ttt.doesNotThrow(() => {
            new fn({ string: 'a'.repeat(200) })._validate()
          })

          const model = new fn({ string: 'a'.repeat(200) })
          ttt.equal(model.string, 'a'.repeat(200), 'model.string')
          ttt.deepEqual(model.toJSON(), {
            string: 'a'.repeat(200)
          }, 'toJSON()')
          ttt.end()
        })
      }
      tt.end()
    })
  }

  t.end()
})
