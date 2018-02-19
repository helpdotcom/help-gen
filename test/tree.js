'use strict'

const test = require('tap').test
const {Prop, Validator} = require('../')
const { propSort } = require('../lib/utils')

function flattenTreeForValidator(opts) {
  const v = new Validator(opts)

  return [...v.listPropTree()].map((check) => {
    return {
      type: check.prop.type
    , displayPath: check.displayPath
    , path: check.path
    }
  }).sort(propSort)
}

test('treeGenerator - basic', (t) => {
  const flattenedTree = flattenTreeForValidator({
    name: 'biscuits'
  , multi: true
  , type: 'test'
  , props: [
      Prop.string().path('str')
    , Prop.array().path('arr').props([
        Prop.number().path('num')
      , Prop.boolean().path('bool')
      ])
    ]
  })

  t.deepEqual(flattenedTree, [
    { type: 'array', displayPath: 'obj', path: 'obj' }
  , { type: 'object', displayPath: 'obj[i]', path: 'obj.^__IDX__1' }
  , { type: 'array', displayPath: 'arr', path: 'obj.^__IDX__1.arr' }
  , { type: 'object'
    , displayPath: 'arr[j]'
    , path: 'obj.^__IDX__1.arr.^__IDX__2' }
  , { type: 'boolean', displayPath: 'arr[j].bool'
    , path: 'obj.^__IDX__1.arr.^__IDX__2.bool' }
  , { type: 'number', displayPath: 'arr[j].num'
    , path: 'obj.^__IDX__1.arr.^__IDX__2.num' }
  , { type: 'string', displayPath: 'str', path: 'obj.^__IDX__1.str' }
  ])

  t.end()
})

test('treeGenerator - generic array', (t) => {
  const flattenedTree = flattenTreeForValidator({
    name: 'biscuits'
  , multi: true
  , type: 'test'
  , props: [ Prop.array().path('arr') ]
  })

  t.deepEqual(flattenedTree, [
    { type: 'array', displayPath: 'obj', path: 'obj' }
  , { type: 'object', displayPath: 'obj[i]', path: 'obj.^__IDX__1' }
  , { type: 'array', displayPath: 'arr', path: 'obj.^__IDX__1.arr' }
  ])

  t.end()
})

test('treeGenerator - generic object', (t) => {
  const flattenedTree = flattenTreeForValidator({
    name: 'biscuits'
  , multi: true
  , type: 'test'
  , props: [ Prop.object().path('obj') ]
  })

  t.deepEqual(flattenedTree, [
    { type: 'array', displayPath: 'obj', path: 'obj' }
  , { type: 'object', displayPath: 'obj[i]', path: 'obj.^__IDX__1' }
  , { type: 'object', displayPath: 'obj', path: 'obj.^__IDX__1.obj' }
  ])

  t.end()
})
