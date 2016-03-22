'use strict'

const test = require('tap').test
const generate = require('../').reader
const fs = require('fs')
const path = require('path')
const utils = require('../lib/ast')

function gen(a) {
  return require('escodegen').generate(a, utils.genOpts)
}

function fixture(fn) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', fn), 'utf8')
}

test('generate', (t) => {
  t.throws(() => {
    generate()
  }, /opts is required/)

  t.throws(() => {
    generate({})
  }, /name is required/)

  t.throws(() => {
    generate({
      name: 'Test'
    }, /props must be an array/)
  })

  const opts = {
    name: 'UIEvent'
  , version: '1.0'
  , delimiter: '|'
  , enums: { messageType: [ 'general' ] }
  , elements: [
      { name: 'totalLength', type: 'int', size: 8 }
    , { name: 'messageType', type: 'enum', size: 2 }
    , { name: 'messageFormatVersion', type: 'char', size: 4 }
    , { name: 'messageValue'
      , type: 'int'
      , size: 3
      , repeatableGroup: 'message'
      , facet: 'count'
      }
    , { name: 'messageValue'
      , type: 'int'
      , size: 8
      , repeatableGroup: 'message'
      , facet: 'length'
      }
    , { name: 'messageValue', type: 'varchar', repeatableGroup: 'message' }
    , { name: 'messageVers', type: 'char', size: 4, repeatableGroup: 'message' }
    , { name: 'messageType', type: 'enum', size: 2, repeatableGroup: 'message' }
    ]
  }

  const out = generate(opts)
  t.equal(out, fixture('repeatable_group.js'))

  // const optsa = {
  //   name: 'UIEvent'
  // , version: '1.0'
  // , delimiter: ''
  // , enums: { messageType: [ 'general' ] }
  // , elements: [
  //     { name: 'totalLength', type: 'int', size: 8 }
  //   , { name: 'messageType', type: 'enum', size: 2 }
  //   , { name: 'messageFormatVersion', type: 'char', size: 4 }
  //   , { name: 'messageValue'
  //     , type: 'int'
  //     , size: 3
  //     , repeatableGroup: 'message'
  //     , facet: 'count'
  //     }
  //   , { name: 'messageValue'
  //     , type: 'int'
  //     , size: 8
  //     , repeatableGroup: 'message'
  //     , facet: 'length'
  //     }
  //   , { name: 'messageValue', type: 'varchar', repeatableGroup: 'message' }
  //   , { name: 'messageVers', type: 'char', size: 4, repeatableGroup: 'message' }
  //   , { name: 'messageType', type: 'enum', size: 2, repeatableGroup: 'message' }
  //   ]
  // }
  opts.delimiter = ''
  const outa = generate(opts)
  t.equal(outa, fixture('repeatable_group_no_delim.js'))

  const opts2 = {
    name: 'UIMessage'
  , version: '1.0'
  , delimiter: '|'
  , enums: {
      messageType: ['general']
    , method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    }
  , elements: [
      { name: 'totalLength', type: 'int', size: 8 }
    , { name: 'messageType', type: 'enum', size: 2 }
    , { name: 'messageFormatVersion', type: 'char', size: 4 }
    , { name: 'id', type: 'UUID', size: 36 }
    , { name: 'replyToId', type: 'uuid', size: 36 }
    , { name: 'statusCode', type: 'int', size: 3 }
    , { name: 'method', type: 'enum', size: 1 }
    , { name: 'uriLength', type: 'int', size: 3 }
    , { name: 'uri', type: 'varchar' }
    , { name: 'bodyLength', type: 'int', size: 8 }
    , { name: 'body', type: 'varchar' }
    ]
  }

  const out2 = generate(opts2)
  t.equal(out2, fixture('message_reader.js'))

  opts2.delimiter = ''
  const out3 = generate(opts2)
  t.equal(out3, fixture('message_reader_no_delim.js'))
  t.end()
})

test('MessageReader#skipLoop', (t) => {
  const m = new generate.Message({
    name: 'UIMessage'
  , version: '1.0'
  , delimiter: '|'
  , enums: {}
  , elements: []
  })

  const a = m.skipLoop(4, 'varchar', 2)
  t.equal(gen(a), 'reader.skip(4).varchar(2)')
  t.end()
})
