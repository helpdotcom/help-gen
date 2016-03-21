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

test('array', (t) => {
  const out = utils.array([utils.literal('general')])
  t.equal(gen(out), `['general']`, 'generated code is correct')
  t.end()
})

test('declareFn', (t) => {
  const out = utils.declareFn('UIMessage', ['buf'])
  t.equal(gen(out), 'function UIMessage(buf) {\n}', 'generated code is correct')
  t.end()
})

test('objectPath', (t) => {
  let str = 'thing'
  let out = utils.objectPath(str)
  t.deepEqual(out, {
    type: 'MemberExpression'
  , object: { type: 'Identifier', name: 'obj' }
  , property: { type: 'Identifier', name: 'thing' }
  , computed: false
  }, `${str} evaluates properly`)
  t.equal(gen(out), `obj.thing`, 'generated code is correct')

  str = 'room.thing'
  out = utils.objectPath(str)
  t.deepEqual(out, {
    type: 'MemberExpression'
  , object: {
      type: 'MemberExpression'
    , object: { type: 'Identifier', name: 'obj' }
    , property: { type: 'Identifier', name: 'room' }
    , computed: false
    }
  , property: { type: 'Identifier', name: 'thing' }
  , computed: false
  }, `${str} evaluates properly`)
  t.equal(gen(out), `obj.room.thing`, 'generated code is correct')

  str = 'room.thing.id'
  out = utils.objectPath(str)
  t.deepEqual(out, {
    type: 'MemberExpression'
  , object: {
      type: 'MemberExpression'
    , object: {
        type: 'MemberExpression'
      , object: { type: 'Identifier', name: 'obj' }
      , property: { type: 'Identifier', name: 'room' }
      , computed: false
      }
    , property: { type: 'Identifier', name: 'thing' }
    , computed: false
    }
  , property: { type: 'Identifier', name: 'id' }
  , computed: false
  }, `${str} evaluates properly`)
  t.equal(gen(out), `obj.room.thing.id`, 'generated code is correct')


  // now, let's verify that computed member expressions work
  str = `room.room-id`
  out = utils.objectPath(str)
  t.deepEqual(out, {
    type: 'MemberExpression'
  , object: {
      type: 'MemberExpression'
    , object: { type: 'Identifier', name: 'obj' }
    , property: { type: 'Identifier', name: 'room' }
    , computed: false
    }
  , property: { type: 'Literal', value: 'room-id', raw: `'room-id'` }
  , computed: true
  }, `${str} evaluates properly`)
  t.equal(gen(out), `obj.room['room-id']`, 'generated code is correct')
  t.end()
})

test('newExpression', (t) => {
  const id = utils.identifier('Biscuits')
  let out = utils.newExpression(id, [])
  t.deepEqual(out, {
    type: 'NewExpression'
  , callee: { type: 'Identifier', name: 'Biscuits' }
  , arguments: []
  }, 'ast generated correctly')
  t.equal(gen(out), 'new Biscuits()', 'generated code is correct')

  out = utils.newExpression('Biscuits', [])
  t.deepEqual(out, {
    type: 'NewExpression'
  , callee: { type: 'Identifier', name: 'Biscuits' }
  , arguments: []
  }, 'ast generated correctly')
  t.equal(gen(out), 'new Biscuits()', 'generated code is correct')
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

test('errorTemplate', (t) => {
  let out = utils.errorTemplate(
    'exp '
  , null
  , '___0'
  )
  t.deepEqual(out, {
    type: 'NewExpression'
  , callee: { type: 'Identifier', name: 'Error' }
  , arguments: [
      { type: 'TemplateLiteral'
      , expressions: [ { type: 'Identifier', name: '___0' } ]
      , quasis: [
          { type: 'TemplateElement'
          , value: { raw: 'exp ', cooked: 'exp '}
          , tail: false
          }
        , { type: 'TemplateElement'
          , value: { raw: '', cooked: '' }
          , tail: true
          }
        ]
      }
    ]
  }, 'creates proper ast')
  t.equal(gen(out), 'new Error(`exp ${ ___0 }`)', 'generated correct')
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
    , property: { type: 'Identifier', name: 'room' }
    , computed: false
    }
  })
  t.equal(gen(out), `!obj.room`, 'generated code is correct')

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
      , property: { type: 'Identifier', name: 'room' }
      , computed: false
      }
    , property: { type: 'Identifier', name: 'id' }
    , computed: false
    }
  })
  t.equal(gen(out), `!obj.room.id`, 'generated code is correct')
  t.end()
})

test('declareVar', (t) => {
  let out = utils.declareVar('test', utils.identifier('undefined'))
  t.deepEqual(out, {
    type: 'VariableDeclaration'
  , declarations: [
      { type: 'VariableDeclarator'
      , id: utils.identifier('test')
      , init: utils.identifier('undefined')
      }
    ]
  , kind: 'const'
  }, 'ast is generated correctly')
  t.equal(gen(out), 'const test = undefined;', 'generated code is correct')

  out = utils.declareVar('test', utils.identifier('undefined'), 'let')
  t.deepEqual(out, {
    type: 'VariableDeclaration'
  , declarations: [
      { type: 'VariableDeclarator'
      , id: utils.identifier('test')
      , init: utils.identifier('undefined')
      }
    ]
  , kind: 'let'
  }, 'ast is generated correctly')
  t.equal(gen(out), 'let test = undefined;', 'generated code is correct')

  out = utils.declareVar('test', utils.identifier('undefined'), 'var')
  t.deepEqual(out, {
    type: 'VariableDeclaration'
  , declarations: [
      { type: 'VariableDeclarator'
      , id: utils.identifier('test')
      , init: utils.identifier('undefined')
      }
    ]
  , kind: 'var'
  }, 'ast is generated correctly')
  t.equal(gen(out), 'var test = undefined;', 'generated code is correct')
  t.end()
})

test('varNeedsBrackets', (t) => {
  const v = utils.varNeedsBrackets
  t.equal(v('test'), false)
  t.equal(v('room-id'), true)
  t.equal(v('_room-id'), true)
  t.equal(v('room id'), true)
  t.equal(v('7632342fds'), true)
  t.equal(v('room_id'), false)
  t.equal(v('room_$id'), false)
  t.equal(v('room_#id'), true)
  t.end()
})
