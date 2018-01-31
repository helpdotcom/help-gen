'use strict'

const test = require('tap').test
const common = require('../../common')
const vm = require('vm')
const Prop = require('@helpdotcom/nano-prop')
const Builder = require('@helpdotcom/build-ast')
const toCode = require('../../../lib/to-code')
const Validator = require('../../../').Validator

const fn = common.compileValidator({
  name: 'list_visitors_response'
, type: 'response'
, props: [
    Prop
      .object()
      .path('visitor.single_pageview')
      .props([
        Prop.uuid().path('visitor_id')
      , Prop.date().path('created_at')
      , Prop.string().path('device')
      , Prop.string().path('url').optional()
      ])
      .optional()
  ]
})

test('Prop.object().allowNull()', (t) => {
  const validator = new Validator({
    name: 'allow_null_test'
  , type: 'response'
  , props: [
      Prop
        .object()
        .path('empty')
        .allowNull()
        .props([
          Prop.string().path('test')
        ])
    , Prop
        .object()
        .path('not_empty')
        .props([
          Prop.string().path('test')
        ])
    ]
  , useObjectAssignForRoot: true
  , synchronousReturn: true
  , performDeepClone: true
  , inputVar: 'opts'
  , resultVar: 'this'
  })

  const sandbox = {
    setImmediate
  , require
  , module: {}
  }
  const { rawBody } = validator.generateRaw()
  const ast = Builder()
    .use('strict')
    .module('test')
    .push(Builder.function('test', [ 'opts' ], rawBody))
    .program()

  const script = new vm.Script(toCode(ast))
  const context = new vm.createContext(sandbox)
  script.runInContext(context)

  const input = {
    empty: null
  , not_empty: {
      test: 'text'
    }
  }
  const output = {}
  sandbox.module.exports.call(output, input)

  const tests = [
    { message: 'input of allowNull() field should match output when null'
    , input: input.empty
    , output: output.empty
    }
  , { message: 'null inputs should not produce undefined output'
    , input: true
    , output: output.empty !== undefined
    }
  , { message: 'input of allowNull() field should match output when not null'
    , input: input.not_empty
    , output: output.not_empty
    }
  ]

  for (let test of tests) {
    t.same(test.output, test.input, test.message)
  }

  t.end()
})

test('Prop.object().props([])', (t) => {
  t.test('empty object passes', (tt) => {
    const valid = fn({}, (err) => {
      tt.error(err)
      tt.equal(valid, true, 'returns true')
      tt.end()
    })
  })

  t.test('missing created_at fails', (tt) => {
    const valid = fn({
      visitor: {
        single_pageview: {}
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err.message,
               /invalid param: "visitor.single_pageview.created_at"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('missing device fails', (tt) => {
    const valid = fn({
      visitor: {
        single_pageview: {
          created_at: new Date().toISOString()
        }
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err.message, /invalid param: "visitor.single_pageview.device"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('invalid url fails', (tt) => {
    const valid = fn({
      visitor: {
        single_pageview: {
          created_at: new Date().toISOString()
        , device: 'Browser'
        , url: {}
        }
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err.message, /invalid param: "visitor.single_pageview.url"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('missing visitor_id fails', (tt) => {
    const valid = fn({
      visitor: {
        single_pageview: {
          created_at: new Date().toISOString()
        , device: 'Browser'
        }
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err.message,
               /invalid param: "visitor.single_pageview.visitor_id"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('everything valid passes', (tt) => {
    const valid = fn({
      visitor: {
        single_pageview: {
          created_at: new Date().toISOString()
        , device: 'Browser'
        , visitor_id: '0733A9C4-1963-492A-B656-26AD0AD8E258'
        }
      }
    }, (err) => {
      tt.error(err)
      tt.equal(valid, true, 'returns true')
      tt.end()
    })
  })

  t.end()
})

test('Prop.object() missing .props() and .passthrough()', (t) => {
  const validator = new Validator({
    name: 'allow_null_test'
  , type: 'response'
  , props: [
      Prop
        .object()
        .path('empty')
        .allowNull()
    ]
  , useObjectAssignForRoot: true
  , synchronousReturn: true
  , performDeepClone: true
  , inputVar: 'opts'
  , resultVar: 'this'
  })

  t.throws(() => {
    validator.generate()
  }, /empty requires either \.props or \.passthrough/)

  t.end()
})
