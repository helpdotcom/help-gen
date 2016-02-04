'use strict'

const escodegen = require('escodegen')
const parse = require('acorn').parse
const fs = require('fs')
const path = require('path')
const utils = require('./ast')
const baseFile = path.join(__dirname, 'base_validator.js')
const base = fs.readFileSync(baseFile, 'utf8')

const genOpts = utils.genOpts

const toChecks = new Map([['obj', true]])

module.exports = function(name, props) {
  if (!name) {
    throw new Error('name is required')
  }

  // props instanceof Array is ~15% faster but will not
  // work if the array was created in a different context.
  // That shouldn't be a problem here, but isn't worth risking.
  if (!Array.isArray(props)) {
    throw new TypeError('props must be an array')
  }

  const ast = parse(base, {
    ecmaVersion: 6
  })

  // ast.body[0] is the default that already exists
  // it checks (!obj || typeof obj !== 'object')
  const bodyNode = ast.body[1]

  // ast.body[1] is isDate()
  // ast.body[2] is isv4UUID()
  // ast.body[3] is isUUID()

  const isUUID = ast.body.pop()
  const isUUIDv4 = ast.body.pop()
  const isDate = ast.body.pop()

  const right = bodyNode.expression.right
  right.id.name = name

  const functionBody = right.body.body
  let hasDate = false
  let hasUUID = false
  for (let i = 0; i < props.length; i++) {
    var type = addValidator(functionBody, props[i])
    if (type === 'date') hasDate = true
    if (type === 'uuid') hasUUID = true
  }

  functionBody.push(utils.returnCB())

  if (hasDate) {
    ast.body.push(isDate)
  }

  if (hasUUID) {
    ast.body.push(isUUIDv4)
    ast.body.push(isUUID)
  }

  toChecks.clear()
  return fixup(escodegen.generate(ast, genOpts))
}

function fixup(str) {
  return str
    .replace(`'use strict';`, `'use strict'\n`)
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/\];$/gm, ']')
    .replace(/;$/gm, '')
}

// obj:
//
//  { name: 'the parameter name' (string)
//  , type: 'the data type of the parameter' (string)
//  , path: 'the dot delimited json path (ex. body.id)' (string)
//  , required: 'is this a required param?' (boolean)
//  }
//
function addValidator(body, obj) {
  if (!obj.name) {
    throw new Error('Invalid rule. `name` is required')
  }

  if (typeof obj.name !== 'string') {
    throw new TypeError('Invalid rule. `name` must be a string')
  }

  if (!obj.type) {
    throw new Error('Invalid rule. `type` is required')
  }

  if (typeof obj.type !== 'string') {
    throw new TypeError('Invalid rule. `type` must be a string')
  }

  if (!obj.path) {
    throw new Error('Invalid rule. `path` is required')
  }

  if (typeof obj.path !== 'string') {
    throw new TypeError('Invalid rule. `path` must be a string')
  }

  if (!obj.hasOwnProperty('required')) {
    throw new Error('Invalid rule. `required` is required')
  }

  const name = obj.name
  const type = obj.type
  const path = obj.path

  if (obj.required) {
    typeofCheckForPath(obj, body)
    return obj.type
  }
}

function typeofCheckForPath(opts, body) {
  const name = opts.name
  const path = opts.path
  const type = opts.type

  const splits = path.split('.')
  if (splits.length === 1) {
    addSingleTypeofCheck(opts, body)
  } else {
    let done = false
    let current = ''
    do {
      if (current === '') {
        current = splits.shift()
      } else {
        if (!splits.length) {
          done = true
          break
        }
        current += `.${splits.shift()}`
      }

      let ty = splits.length ? 'object' : type

      addSingleTypeofCheck({
        name: name
      , path: current
      , type: ty
      }, body)
    } while (!done)
  }
}

function addSingleTypeofCheck(opts, body) {
  if (toChecks.has(opts.path)) {
    return
  }
  toChecks.set(opts.path, true)
  if (opts.type !== 'date' && opts.type !== 'uuid') {
    let v = utils.nextVar()
    let mem = utils.typeofExpression(
      utils.memberExpression(opts.path)
    )
    body.push(utils.declareVar(v, mem, 'const'))
    body.push(utils.typeofCheck(opts.name, opts.type, opts.path, v))
  } else {
    body.push(utils.typeofCheck(opts.name, opts.type, opts.path))
  }
}
