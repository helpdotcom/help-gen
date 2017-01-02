'use strict'

const test = require('tap').test
const Prop = require('@helpdotcom/nano-prop')
const Validator = require('../').Validator

test('top level vars - can merge the vars of multiple generate calls', (t) => {
  const input1 = {
    name: 'merge_test_1'
  , type: 'test'
  , props: [
      Prop.regex(/\w+/).path('a')
    ]
  }

  const input2 = {
    name: 'merge_test_2'
  , type: 'test'
  , props: [
      Prop.regex(/\w+/).path('b')
    ]
  }

  const v1 = new Validator(input1)
  const tlv1 = v1.generateRaw().topLevelVars
  const v2 = new Validator(input2)
  const tlv2 = v2.generateRaw().topLevelVars

  t.equal(tlv1.build().length, 1)
  t.equal(tlv2.build().length, 1)
  const mergedTLVs = tlv1.merge(tlv2)

  t.equal(mergedTLVs.build().length, 1)

  t.end()
})
