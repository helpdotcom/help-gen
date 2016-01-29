'use strict'

const test = require('tap').test
const utils = require('../lib/ast')
const generate = require('escodegen').generate

function gen(a) {
  return generate(a, utils.genOpts)
}

test('literal', (tt) => {
  test('raw', (t) => {
    let out = utils.literal('obj', `'obj'`)
    t.deepEqual(out, {
      type: 'Literal'
    , value: 'obj'
    , raw: `'obj'`
    }, 'Literal raw and value are correct')
    t.equal(gen(out), `'obj'`, 'generated code is correct')
    t.end()
  })

  test('value', (t) => {
    let out = utils.literal('obj')
    t.deepEqual(out, {
      type: 'Literal'
    , value: 'obj'
    }, 'Literal value is correct')
    t.equal(gen(out), `'obj'`, 'generated code is correct')
    t.end()
  })

  tt.end()
})

test('identifier', (t) => {
  let out = utils.identifier('obj')
  t.deepEqual(out, {
    type: 'Identifier'
  , name: 'obj'
  }, 'Identifier name is correct')
  t.equal(gen(out), 'obj', 'generated code is correct')
  t.end()
})

test('memberExpression', (t) => {
  let str = 'thing'
  let out = utils.memberExpression(str)
  t.deepEqual(out, {
    type: 'MemberExpression'
  , object: { type: 'Identifier', name: 'obj' }
  , property: { type: 'Literal', value: 'thing', raw: `'thing'` }
  , computed: true
  }, `${str} evaluates properly`)
  t.equal(gen(out), `obj['thing']`, 'generated code is correct')

  str = 'room.thing'
  out = utils.memberExpression(str)
  t.deepEqual(out, {
    type: 'MemberExpression'
  , object: {
      type: 'MemberExpression'
    , object: { type: 'Identifier', name: 'obj' }
    , property: { type: 'Literal', value: 'room', raw: `'room'` }
    , computed: true
    }
  , property: { type: 'Literal', value: 'thing', raw: `'thing'` }
  , computed: true
  }, `${str} evaluates properly`)
  t.equal(gen(out), `obj['room']['thing']`, 'generated code is correct')

  str = 'room.thing.id'
  out = utils.memberExpression(str)
  t.deepEqual(out, {
    type: 'MemberExpression'
  , object: {
      type: 'MemberExpression'
    , object: {
        type: 'MemberExpression'
      , object: { type: 'Identifier', name: 'obj' }
      , property: { type: 'Literal', value: 'room', raw: `'room'` }
      , computed: true
      }
    , property: { type: 'Literal', value: 'thing', raw: `'thing'` }
    , computed: true
    }
  , property: { type: 'Literal', value: 'id', raw: `'id'` }
  , computed: true
  }, `${str} evaluates properly`)
  t.equal(gen(out), `obj['room']['thing']['id']`, 'generated code is correct')


  t.end()
})

test('error', (t) => {
  let out = utils.error('This is an error')
  t.deepEqual(out, {
    type: 'NewExpression'
  , callee: {
      type: 'Identifier'
    , name: 'Error'
    }
  , arguments: [
      {
        type: 'Literal'
      , value: 'This is an error'
      , raw: `'This is an error'`
      }
    ]
  }, 'error returns properly')
  t.equal(gen(out), `new Error('This is an error')`, 'generated correct')
  t.end()
})

test('cbWithError', (t) => {
  let out = utils.cbWithError('This is an error', 'TypeError')
  t.deepEqual(out, {
    type: 'ExpressionStatement'
  , expression: {
      type: 'CallExpression'
    , callee: utils.identifier('cb')
    , arguments: [utils.error('This is an error', 'TypeError')]
    }
  })
  t.match(gen(out), `cb(new TypeError('This is an error'))`, 'generated')
  t.end()
})

test('blockStatement', (t) => {
  let out = utils.blockStatement([
    utils.literal('obj')
  ])
  t.deepEqual(out, {
    type: 'BlockStatement'
  , body: [
      utils.literal('obj')
    ]
  })
  t.match(gen(out), `{\n  'obj'\n}`, 'generated code is correct')
  t.end()
})

test('returnError', (t) => {
  let out = utils.returnError('TestMessage')
  let exp = `return setImmediate(() => {
  cb(new Error('TestMessage'))\n})`
  t.match(gen(out), exp, 'generated code is correct')
  t.deepEqual(out, {
    type: 'ReturnStatement'
  , argument: {
      type: 'CallExpression'
    , callee: utils.identifier('setImmediate')
    , arguments: [
        {
          type: 'ArrowFunctionExpression'
        , id: null
        , generator: false
        , expression: false
        , params: []
        , body: utils.blockStatement([
            utils.cbWithError('TestMessage', 'Error')
          ])
        }
      ]
    }
  })
  t.end()
})

test('notExpression', (t) => {
  let str = 'room'
  let out = utils.notExpression(str)
  t.deepEqual(out, {
    type: 'UnaryExpression'
  , operator: '!'
  , prefix: true
  , argument: {
      type: 'MemberExpression'
    , object: { type: 'Identifier', name: 'obj' }
    , property: { type: 'Literal', value: 'room', raw: `'room'` }
    , computed: true
    }
  })
  t.equal(gen(out), `!obj['room']`, 'generated code is correct')

  str = 'room.id'
  out = utils.notExpression(str)

  t.deepEqual(out, {
    type: 'UnaryExpression'
  , operator: '!'
  , prefix: true
  , argument: {
      type: 'MemberExpression'
    , object: {
        type: 'MemberExpression'
      , object: { type: 'Identifier', name: 'obj' }
      , property: { type: 'Literal', value: 'room', raw: `'room'` }
      , computed: true
      }
    , property: { type: 'Literal', value: 'id', raw: `'id'` }
    , computed: true
    }
  })
  t.equal(gen(out), `!obj['room']['id']`, 'generated code is correct')
  t.end()
})
