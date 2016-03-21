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
}

module.exports = function createMessage(name, props) {
  return new Message(name, props).generate()
}

Message.prototype.generate = function generate() {
  this._processModule()
  this._processElements()

  return fixup(escodegen.generate(this.ast, utils.genOpts))
}

function parseJS(str) {
  return parse(str, {
    ecmaVersion: 6
  })
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
}

const zeroLiteral = utils.literal(0, '0')

Message.prototype.forLoop = function forLoop(varName) {
  // use var because let is ~6x slower than var right now
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

Message.prototype.forInner = function forInner(varName, size) {
  // TODO(evanlucas) handle non-varchars in a repeatableGroup
  // this.messages[i]
  const left = utils.memberExpression(utils.thisExpression(
    varName
  ), utils.identifier('i'), true)

  // for now, this assumes that the value of the readableGroup
  // will always be a varchar
  const right = utils.callExpression(
    utils.objectPath(`reader.varchar`, true)
  , [utils.literal(+size, `'${size}'`)]
  )

  return utils.expressionStatement(
    left
  , right
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
  for (let i = 0; i < this.props.length; i++) {
    const prop = this.props[i]
    prop.type = prop.type.toLowerCase()
    const name = prop.name
    if (prop.repeatableGroup) {
      if (prop.facet === 'count') {
        const obj = {
          varName: prop.name.replace('Value', 's')
        , len: prop.size
        , for: null
        }

        obj.for = this.forLoop(obj.varName)
        this.groups.set(name, obj)
        const varName = name.replace('Value', 's')
        body.push(this.createArray(varName, prop.size))
      } else if (prop.facet === 'length') {
        const obj = this.groups.get(name)
        if (!obj) {
          throw new Error('Invalid specification. Count facet should be first.')
        }

        const bod = obj.for.body.body
        bod.push(this.forInner(obj.varName, prop.size))
      } else if (!prop.facet) {
        const obj = this.groups.get(name)
        if (!obj) {
          throw new Error('Invalid specification. Count facet should be first.')
        }

        body.push(obj.for)
      }
    } else {
      if (this.names.has(name)) {
        throw new Error(`Names must be unique. "${name}" has already been used.`)
      }

      this.names.set(name, prop)
      this.assign(prop, body)

      // if delimiter, skip delimiter.length
      if (this.delimiter && this.delimiter.length) {
        body.push(this.skipDelim())
      }
      this._prev = prop
    }
  }
}

Message.prototype.skipDelim = function skipDelim() {
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

function fixup(str) {
  return '/* eslint-disable */\n\n' + str
    .replace(`'use strict';`, `'use strict'`)
    .replace(/module\.exports = ([\w]+);?$/mi, '\nmodule.exports = $1')
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/;$/gm, '')
    .replace(/function/g, '\nfunction')
    .replace(/^const/gm, '\nconst') +
    '\n\n/* eslint-enable */\n'
}

Message.prototype.assign = function assign(opts, fnBody) {
  const left = utils.thisExpression(opts.name)
  const readFnName = readerFnForType(opts.type)

  if (opts.repeatableGroup) {
    this._repeatable = opts.repeatableGroup
  } else {
    this._repeatable = null
  }

  if (opts.type === 'varchar') {
    const current = this.names.get(opts.name)
    const prev = this._prev ? this.names.get(this._prev.name) : null
    if (!prev || prev.type !== 'int') {
      throw new Error('The element before a varchar must be an int')
    }

    opts.size = prev.size
    // pop off the last one since varchar handles it
    // if we have a delimiter, pop off 2
    fnBody.pop()
    if (this.delimiter && this.delimiter.length)
      fnBody.pop()
  } else if (!opts.size) {
    throw new Error(`type "${opts.type}" requires a size`)
  }

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
