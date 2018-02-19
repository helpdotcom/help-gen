'use strict'

const test = require('tap').test
const toCode = require('../../lib/to-code')
const Builder = require('@helpdotcom/build-ast')
const {Prop, Validator} = require('../../')

test('validators can clone onto an existing object', (t) => {
  const input = {
    name: 'clone_target_test1'
  , type: 'test'
  , props: [
      Prop.regex(/^\w+$/).path('a')
    ]
  , useObjectAssignForRoot: true
  , performDeepClone: true
  , resultVar: 'foobar'
  }

  const v = new Validator(input)
  const { rawBody } = v.generateRaw()
  const code = toCode(Builder().push(...rawBody).program())

  t.matches(code, /Object\.assign\(foobar/)

  t.end()
})
