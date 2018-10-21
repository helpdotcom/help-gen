'use strict'

const {Prop} = require('../../../')
const test = require('tap').test
const common = require('../../common')
const compile = common.compileManager

const m = {
  name: 'test'
, type: 'test'
, props: [
    Prop.object().path('message').props([
      Prop.object().path('entityMap').passthrough()
    , Prop.object().path('canBeNull').passthrough().allowNull()
    , Prop.array().path('blocks').props(
        Prop.object().props([
          Prop.string().path('text')
        , Prop.number().path('depth')
        ])
      )
    ])
  ]
}

const fn = compile(m)

test('Nested object', (t) => {
  t.throws(() => {
    new fn()
  }, /Expected object, got undefined/)

  t.throws(() => {
    new fn({})
  }, /invalid property: "message"/)

  t.doesNotThrow(() => {
    const opts = {
      message: {
        entityMap: {}
      , canBeNull: {
          foo: 'bar'
        }
      , blocks: [
          { text: 'biscuits', depth: 1 }
        ]
      }
    }
    const model = new fn(opts)._validate()
    t.deepEqual(model.toJSON(), opts)
  })

  const opts = {
    message: {
      entityMap: {}
    , canBeNull: null
    , blocks: [
        { text: 'biscuits', depth: 1 }
      ]
    }
  }
  const model = new fn(opts)._validate()
  t.deepEqual(model.toJSON(), opts)

  model.message.entityMap = false
  t.throws(() => {
    model._validate()
  }, /invalid property: "message\.entityMap"/)

  t.throws(() => {
    model.toJSON()
  }, /invalid property: "message\.entityMap"/)

  model.message.entityMap = {}
  model.message.blocks.push(null)
  t.throws(() => {
    model._validate()
  }, /invalid property: "message\.blocks\[i\]"/)

  t.end()
})
