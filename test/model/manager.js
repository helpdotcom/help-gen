'use strict'

const test = require('tap').test
const {ModelManager, Prop} = require('../../')

const ALREADY_DEFINED_ERROR = 'Model "Visitor" has already been defined'
const INVALID_NAME_ERROR = 'name is required and must be a valid identifier'
const INVALID_TYPE_ERROR = 'type is required and must be a string'
const INVALID_PROPS_ERROR = 'props is required and must be an array'

test('ModelManager', (t) => {
  const manager = new ModelManager({
    configs: [
      { name: 'Visitor'
      , type: 'visitor'
      , props: [
          Prop.uuid().path('id')
        ]
      }
    ]
  })

  t.type(manager.factory, Map)

  t.throws(() => {
    manager.define({
      name: 'Visitor'
    , type: 'visitor'
    , props: []
    })
  }, ALREADY_DEFINED_ERROR, 'throws if model name has already been defined')

  t.throws(() => {
    new ModelManager({
      configs: [
        {}
      ]
    })
  }, INVALID_NAME_ERROR, 'throws if model name is falsy')

  t.throws(() => {
    new ModelManager({
      configs: [
        { name: 'not a valid identifier' }
      ]
    })
  }, INVALID_NAME_ERROR, 'throws if model name is not valid identifier')

  t.throws(() => {
    new ModelManager({
      configs: [
        { name: 'Valid' }
      ]
    })
  }, INVALID_TYPE_ERROR, 'throws if model type is falsy')

  t.throws(() => {
    new ModelManager({
      configs: [
        { name: 'Valid', type: true }
      ]
    })
  }, INVALID_TYPE_ERROR, 'throws if model type is not a string')

  t.throws(() => {
    new ModelManager({
      configs: [
        { name: 'Valid', type: 'valid', props: {} }
      ]
    })
  }, INVALID_PROPS_ERROR, 'throws if model props is not an array')

  t.test('all parameters are optional', (tt) => {
    const map = new ModelManager({}).generate()
    tt.equal(map.size, 1)
    tt.same([...map.keys()], ['Index'])
    tt.end()
  })

  t.end()
})
