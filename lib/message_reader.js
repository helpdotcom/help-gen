'use strict'

const escodegen = require('escodegen')
const parse = require('acorn').parse
const utils = require('./ast')
const fs = require('fs')
const path = require('path')
const baseFile = path.join(__dirname, 'base_message.js')
const base = fs.readFileSync(baseFile, 'utf8')

const genOpts = utils.genOpts

function Message(opts) {
  if (!(this instanceof Message))
    return new Message(opts)

  if (!opts || typeof opts !== 'object') {
    throw new Error('opts is required')
  }

  const name = opts.name
  const props = opts.elements
  const version = opts.version
  const delimiter = opts.delimiter

  if (!name) {
    throw new Error('name is required')
  }

  if (!Array.isArray(props)) {
    throw new TypeError('props must be an array')
  }

  this.name = name
  this.props = props
  this.enums = opts.enums
  this.version = version
  this.delimiter = opts.delimiter

  this._enums = new Map()
  this.names = new Map()
  this.groups = new Map()
  this._prev = null
  this._delimNode = null

  this._repeatable = null

  this.ast = parseJS(base)

  this.preprocess()
}

module.exports = function createMessage(opts) {
  return new Message(opts).generate()
}

module.exports.Message = Message

Message.prototype.generate = function generate() {
  this._processModule()
  this._processElements()

  this.groups.clear()
  return fixup(escodegen.generate(this.ast, utils.genOpts), this.name)
}

function parseJS(str) {
  return parse(str, {
    ecmaVersion: 6
  })
}

// munge the data to something that prevents us from having to backtrack
// This will wrap all message groups into their own "prop".
// Which will be passed to Message#addGroup()
Message.prototype.preprocess = function preprocess() {
  var currentGroup = null
  const out = []

  for (var i = 0; i < this.props.length; i++) {
    // Use Object.assign to copy the object.
    // Objects are passed by ref, not value
    const prop = Object.assign({}, this.props[i])
    prop.type = prop.type.toLowerCase()

    if (!prop.repeatableGroup) {
      if (prop.type !== 'varchar') {
        out.push(prop)
        continue
      }

      // the previous one should be an int
      const prev = out.pop()
      if (prev.type !== 'int') {
        throw new Error('Element preceding varchar must be of type int')
      }

      // This is a varchar. Set the size of it to the size of the previous
      // facet length item
      prop.size = prev.size
      // nothing else to do, but push
      out.push(prop)
      continue
    }

    if (prop.facet === 'count') {
      if (currentGroup && currentGroup !== prop.repeatableGroup) {
        // We have entered a new repeatableGroup
        // Close out the current one and push it off
        const g = this.groups.get(currentGroup)
        out.push({
          name: g.group
        , count: g.count
        , items: g.items
        , realname: g.realname
        , type: 'group'
        })
        this.groups.delete(currentGroup)
        currentGroup = null
        continue
      }

      currentGroup = prop.repeatableGroup
      // Store the group so we can reference from different elements
      this.groups.set(prop.repeatableGroup, {
        count: prop.size
      , prevLen: -1
      , items: []
      , group: prop.repeatableGroup
      , realname: prop.name
      })
    } else if (prop.facet === 'length') {
      // This will be proceeding a varchar
      const g = this.groups.get(prop.repeatableGroup)
      if (!g) {
        throw new Error(`Cannot find repeatableGroup ${prop.repeatableGroup}`)
      }

      if (prop.type !== 'int') {
        throw new Error('Element with facet length must be an int')
      }

      // prevLen gives us access to the previous element's size
      g.prevLen = prop.size
    } else {
      const g = this.groups.get(prop.repeatableGroup)
      if (!g) {
        throw new Error(`Cannot find repeatableGroup ${prop.repeatableGroup}`)
      }

      if (prop.type === 'varchar') {
        // Assign the varchar size from the previous elements
        prop.size = g.prevLen
        g.prevLen = -1
        delete prop.repeatableGroup
        g.items.push(prop)
      } else {
        g.prevLen = -1
        delete prop.repeatableGroup
        g.items.push(prop)
      }
    }
  }

  // We may have a repeatableGroup left over that we have not
  // pushed yet. Go ahead and push it
  if (currentGroup) {
    const g = this.groups.get(currentGroup)
    out.push({
      name: g.group
    , count: g.count
    , items: g.items
    , realname: g.realname
    , type: 'group'
    })
    this.groups.delete(currentGroup)
    currentGroup = null
  }

  this.props = out
}

Message.prototype._setStatics = function _setStatics() {
  const delim = this.delimiter || ''
  const body = this.ast.body

  // NAME.DELIMITER = '|'
  body.push(utils.expressionStatement(
    utils.objectPath(`${this.name}.DELIMITER`, true)
  , utils.literal(delim)
  ))

  // NAME.VERSION = '1.0'
  body.push(utils.expressionStatement(
    utils.objectPath(`${this.name}.VERSION`, true)
  , utils.literal(this.version)
  ))
}

Message.prototype._processModule = function _processModule() {
  const name = this.name

  const lines = [
    `const Reader = require('@helpdotcom/buffer-utils').Reader`
  , `module.exports = ${name}`
  ]

  const body = this.ast.body

  lines.forEach((item) => {
    body.push(parseJS(item))
  })

  this._processEnums()
  this._setStatics()
}

const zeroLiteral = utils.literal(0, '0')

// Creates a ForStatement
// varName should be the property name assigned to `this`
// If the varName is messages, `this.messages.length` will be used
Message.prototype.forLoop = function forLoop(varName) {
  // use var because let is ~6x slower than var right now
  // when we hit v8 5.1, this should be much better,
  // but won't be until node v6 at least
  const init = utils.declareVar('i', zeroLiteral, 'var')
  const test = utils.binaryExpression(
    '<'
  , utils.identifier('i')
  , utils.memberExpression(
      utils.thisExpression(varName)
    , utils.identifier('length')
    , false
    )
  )
  const update = utils.updateExpression('++', utils.identifier('i'))
  return utils.forStatement(init, test, update)
}

// this.varName[i] = {}
Message.prototype.forInner = function forInner(varName, right) {
  const left = utils.memberExpression(utils.thisExpression(
    varName
  ), utils.identifier('i'), true)

  return utils.expressionStatement(left, right)
}

function id(str) {
  return utils.identifier(str)
}

Message.prototype.assertName = function assertName(name) {
  if (this.names.has(name)) {
    throw new Error(`Names must be unique. "${name}" has already been used.`)
  }
}

// (messageValue, message) => 'value'
// (messageVersion, message) => 'version'
function getName(n, group) {
  const o = n.replace(group, '')
  return `${o[0].toLowerCase()}${o.slice(1)}`
}

Message.prototype.addGroup = function addGroup(prop, body) {
  const count = prop.count
  // add an s onto the name. It is a group, aka plural
  const name = prop.name + 's'

  this.assertName(name)
  this.names.set(name, prop)

  // this.messages = new Array(reader.int(3))
  body.push(this.createArray(name, prop.count))

  // for (var i = 0; i < this.messages.length; i++) {}
  const forLoop = this.forLoop(name)
  const forBody = forLoop.body.body

  const items = prop.items
  const props = new Array(items.length)
  const delimLen = this.delimiter
    ? this.delimiter.length
    : 0

  // Loop through each item in the repeatableGroup
  // and push it onto the props array
  for (var i = 0; i < items.length; i++) {
    const item = items[i]
    const key = item.type === 'enum'
      ? utils.identifier(item.name)
      : utils.identifier(getName(item.name, prop.name))
    let val = this.skipLoop(+delimLen, item.type, item.size)
    if (item.type === 'enum') {
      const enumName = this._enums.get(item.name)
      if (!enumName) {
        throw new Error(`Missing enum "${enumName}"`)
      }
      val = utils.memberExpression(
        utils.identifier(enumName)
      , val
      , true
      )
    }
    props[i] = utils.property(key, val, 'init')
  }

  // Inside the for loop, assign this.varName[i] to the props wrapped in an
  // ObjectExpression
  forBody.push(this.forInner(name, utils.objectExpression(props)))

  // push the for loop onto the body of the constructor
  body.push(forLoop)
}

// Adds a single property that is not a repeatableGroup
Message.prototype.addItem = function addItem(prop, body) {
  const name = prop.name
  this.assertName(name)

  this.names.set(name, prop)
  this.assign(prop, body)

  if (this.delimiter && this.delimiter.length) {
    body.push(this.skipDelim())
  }
}

// skips the correct number of *characters* (not bytes)
// for when we need to declare a property's value in an ObjectExpression
// depending on the delimiter
Message.prototype.skipLoop = function skipLoop(skipSize, type, size) {
  if (!skipSize) {
    // we have no delimiter
    // don't waste a function that does absolutely nothing (reader.skip(0))
    return utils.callExpression(
      utils.memberExpression(
        id('reader')
      , id(readerFnForType(type))
      , false
      )
    , [utils.literal(size, `'${size}'`)]
    )
  }

  return utils.callExpression(
    utils.memberExpression(
      utils.callExpression(
        utils.memberExpression(id('reader'), id('skip'), false)
      , [utils.literal(skipSize, `'${skipSize}'`)]
      )
    , id(readerFnForType(type))
    , false
    )
  , [utils.literal(size, `'${size}'`)]
  )
}

Message.prototype._processElements = function _processElements() {
  const ast = this.ast
  const fn = utils.declareFn(this.name, ['buf'])
  const body = fn.body.body
  ast.body.push(fn)

  const callee_ = utils.identifier('Reader')
  const init = utils.newExpression(callee_, [
    utils.identifier('buf')
  ])
  const readerVar = utils.declareVar('reader', init, 'const')
  // const reader = new Reader(buf)
  // now push it onto the prototype body
  body.push(readerVar)

  // here, we are going to add all of the property assignments
  // this.thing = 'biscuits'
  // etc.
  for (var i = 0; i < this.props.length; i++) {
    const prop = this.props[i]

    if (prop.type === 'group') {
      this.addGroup(prop, body)
    } else {
      this.addItem(prop, body)
    }
  }
}

Message.prototype.skipDelim = function skipDelim() {
  // Only create the AST node for a delimiter skip one time
  // This assumes we *wont'* be modifying that node.
  if (this._delimNode)
    return this._delimNode

  const len = this.delimiter.length
  const args = [
    utils.literal(len, `'${len}'`)
  ]

  const exp = utils.callExpression(
    utils.objectPath('reader.skip', true)
  , args
  )

  this._delimNode = {
    type: 'ExpressionStatement'
  , expression: exp
  }

  return this._delimNode
}

function readerFnForType(type) {
  switch (type) {
    case 'enum':
    case 'char':
      return 'char'
    case 'uuid':
    case 'UUID':
      return 'uuid'
    default:
      return type
  }
}

function fixup(str, name) {
  return '/* eslint-disable */\n\n' + str
    .replace(`'use strict';`, `'use strict'`)
    .replace(/module\.exports = ([\w]+);?$/mi, '\nmodule.exports = $1')
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/;$/gm, '')
    .replace(/function/g, '\nfunction')
    .replace(/^const/gm, '\nconst')
    .replace(new RegExp(`${name}\.DELIMITER`, 'gm'), `\n${name}.DELIMITER`) +
    '\n\n/* eslint-enable */\n'
}

Message.prototype.assign = function assign(opts, fnBody) {
  const left = utils.thisExpression(opts.name)
  const readFnName = readerFnForType(opts.type)

  const args = opts.type !== 'uuid'
    ? [utils.literal(opts.size, `'${opts.size}'`)]
    : []

  const right = utils.callExpression(
    utils.objectPath(`buffer.${readFnName}`, true)
  , args
  )

  if (opts.type !== 'enum') {
    return fnBody.push(utils.expressionStatement(left, right))
  }

  const enumName = this._enums.get(opts.name)

  return fnBody.push(utils.expressionStatement(
    left
  , utils.memberExpression(
      utils.identifier(enumName)
    , right
    , true
    )
  ))
}

// Creates an array
// createArray('messages', 3)
// this.messages = new Array(reader.int(3))
Message.prototype.createArray = function createArray(varName, len) {
  return utils.expressionStatement(
    utils.thisExpression(varName)
  , utils.newExpression('Array', [
      utils.callExpression(utils.objectPath('buffer.int', true), [
        utils.literal(len, `'${len}'`)
      ])
    ])
  )
}

Message.prototype._processEnums = function _processEnums() {
  const keys = Object.keys(this.enums)
  const body = this.ast.body
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const $enum = this.enums[key]
    const upper = `ENUM_${key.toUpperCase()}`
    // declare a const var named UPPER

    const items = $enum.map((item) => {
      return utils.literal(item)
    })
    const init = utils.array(items)
    const v = utils.declareVar(upper, init, 'const')

    this._enums.set(key, upper)

    body.push(v)
  }
}
