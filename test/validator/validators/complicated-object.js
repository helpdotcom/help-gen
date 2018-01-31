'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const common = require('../../common')
const compileValidator = common.compileValidator

test ('validator - complicated object with props', (t) => {
  const input = {
    name: 'objecttest'
  , type: 'test'
  , props: [
      Prop.number().path('id')
    , Prop.object().path('event_content').props([
        Prop.string().path('searchable_content')
      , Prop.object().path('formatted_content').allowNull().props([
          Prop.object().path('entityMap').passthrough()
        , Prop.array().path('blocks').props(
            Prop.object().props([
              Prop.string().path('text')
            , Prop.number().path('depth').min(0)
            , Prop.string().path('key').optional()
            ])
          )
        ])
      ])
    ]
  }

  const fn = compileValidator(input)

  const tests = [
    { input: {}
    , error: 'invalid param: "event_content". Expected object'
    , name: 'empty object'
    }
  , { input: { event_content: {} }
    , error: 'invalid param: "event_content.formatted_content". Expected object'
    , name: 'empty event_content'
    }
  , {
      input: {
        event_content: {
          formatted_content: null
        }
      }
    , error: 'invalid param: "event_content.searchable_content". Expected strin'
    , name: 'missing searchable_content with null formatted_content'
    }
  , {
      input: {
        event_content: {
          formatted_content: {
            blocks: []
          }
        , searchable_content: 'test'
        }
      }
    , error: 'invalid param: "event_content.formatted_content.entityMap".'
    , name: 'missing entityMap'
    }
  , {
      input: {
        event_content: {
          formatted_content: {
            blocks: []
          , entityMap: {}
          }
        , searchable_content: 'test'
        }
      }
    , error: 'invalid param: "id". Expected number'
    , name: 'missing id'
    }
  ]

  for (const item of tests) {
    t.test(item.name, (tt) => {
      const valid = fn(item.input, (err) => {
        if (item.error === null) {
          tt.equal(err, null, 'does not fail')
          tt.equal(valid, true, 'returns true')
        } else {
          tt.type(err, Error)
          tt.match(err.message, item.error)
          tt.equal(err.code, 'EINVAL', 'err.code === \'EINVAL\'')
          tt.equal(valid, false, 'returns false')
        }
        tt.end()
      })
    })
  }
  t.end()
})
