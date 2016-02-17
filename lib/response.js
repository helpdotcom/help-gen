'use strict'

const escodegen = require('escodegen')
const parse = require('acorn').parse
const fs = require('fs')
const path = require('path')
const utils = require('./ast')
const checks = require('./checks')
const baseFile = path.join(__dirname, 'base_response.js')
const base = fs.readFileSync(baseFile, 'utf8')

const genOpts = utils.genOpts
const toChecks = new Map([['this', true]])
const decls = new Map()

module.exports = function(name, props) {
  if (!name) {
    throw new Error('name is required')
  }

  if (!Array.isArray(props)) {
    throw new TypeError('props must be an array')
  }

  const ast = parse(base, {
    ecmaVersion: 6
  })

  // um, sorry :/
  // module.exports = _name_
  ast.body[1].expression.right.name = name

  // Change constructor name to _name_
  ast.body[2].id.name = name

  // Change static MemberExpression from Base to _name_
  ast.body[3].expression.left.object.name = name

  // Change NewExpression constructor to _name_
  ast.body[3].expression.right.body.body[0].argument.callee.name = name

  // Change ExpressionStatement for prototype to _name_
  ast.body[4].expression.left.object.object.name = name

  // this is where we will start adding properties
  // It is right after `opts = opts || {}` in base_response.js
  const bodyNode = ast.body[2].body.body

  // This is where we will be adding our validations.
  // It is inside the Base#isValid() function
  const validNode = ast.body[4].expression.right.body.body

  // isUUID is the last body member
  // then, isUUIDv4
  // then, isDate
  const isUUID = ast.body.pop()
  const isUUIDv4 = ast.body.pop()
  const isDate = ast.body.pop()

  declareValidVars(validNode)
  let hasDate = false
  let hasUUID = false

  for (let i = 0; i < props.length; i++) {
    let type = addValidation(bodyNode, validNode, props[i])
    if (type === 'date') hasDate = true
    if (type === 'uuid') hasUUID = true
  }

  addValidReturn(validNode)

  if (hasDate) {
    ast.body.push(isDate)
  }

  if (hasUUID) {
    ast.body.push(isUUIDv4)
    ast.body.push(isUUID)
  }

  // now, process all of the object-level declarations
  for (const decl of decls) {
    // decl is an array of arrays of properties that should default to undefined
    // decl[0] is the property name
    // decl[1] is an array of the sub property names

    const subprops = decl[1].map((item) => {
      return utils.property(
        utils.identifier(item)
      , utils.identifier(undefined)
      , 'init'
      )
    })
    const obj = utils.objectExpression(subprops)
    const left = utils.thisExpression(decl[0])
    const right = utils.logicalOr(
      utils.memberExpression(`opts.${decl[0]}`, true)
    , obj
    )
    bodyNode.push(utils.expressionStatement(left, right))
  }

  return fixup(escodegen.generate(ast, genOpts))
}

function fixup(str) {
  return str
    .replace(`'use strict';`, `'use strict'\n`)
    .replace(/module\.exports = ([\w]+);$/mi, 'module.exports = $1\n')
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/;$/gm, '')
}

// If we want to allow the default value in the future,
// we will need to make prop be an object instead of a string
function addDeclaration(body, prop) {
  if (typeof prop !== 'object') {
    throw new TypeError(`Expected property to be object, got ${typeof prop}`)
  }
  const left = utils.thisExpression(prop.path)
  const right = utils.logicalOr(
    utils.memberExpression(`opts.${prop.path}`, true)
  , utils.identifier('undefined')
  )

  body.push(utils.expressionStatement(left, right))
}

function addValidation(bodyNode, validNode, obj) {
  checks.checkValidation(obj)

  const name = obj.name
  const type = obj.type
  const path = obj.path

  typeofCheckForPath(obj, bodyNode, validNode)
  return obj.type
}

function typeofCheckForPath(opts, bodyNode, body) {
  const name = opts.name
  const path = opts.path
  const type = opts.type

  const splits = path.split('.')
  const topLevel = splits[0]

  if (splits.length === 1) {
    addDeclaration(bodyNode, opts)
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
          decls.get(topLevel).push(current.replace(`${topLevel}.`, ''))
          break
        }
        current += `.${splits.shift()}`
      }

      let ty = splits.length ? 'object' : type
      if (!decls.has(topLevel)) {
        decls.set(topLevel, [])
      }

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
      utils.memberExpression(`this.${opts.path}`, true)
    )
    body.push(utils.declareVar(v, mem, 'const'))
    body.push(utils.syncTypeofCheck(opts.name, opts.type, opts.path, v))
  } else {
    body.push(utils.syncTypeofCheck(opts.name, opts.type, opts.path))
  }
}

function declareValidVars(body) {
  const exp = utils.objectExpression([
    utils.property(
      utils.identifier('valid')
    , utils.literal(true)
    )
  , utils.property(
      utils.identifier('msg')
    , utils.literal('', `''`)
    )
  ])

  const v = utils.declareVar('out', exp, 'const')
  body.push(v)
}

function addValidReturn(body) {
  body.push(utils.returnOut())
}
