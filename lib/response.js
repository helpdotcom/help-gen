'use strict'

const escodegen = require('escodegen')
const parse = require('acorn').parse
const fs = require('fs')
const path = require('path')
const utils = require('./ast')
const PathEach = require('./path-each')
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

  validNode.push(getValidVars())
  let hasDate = false
  let hasUUID = false

  for (let i = 0; i < props.length; i++) {
    let type = addValidation(bodyNode, validNode, props[i])
    if (type === 'date') hasDate = true
    if (type === 'uuid') hasUUID = true
  }

  // Add `return out` to the end of the isValid() function
  validNode.push(utils.returnOut())

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

function getDeclaration(prop) {
  if (typeof prop !== 'object') {
    throw new TypeError(`Expected property to be object, got ${typeof prop}`)
  }
  const left = utils.thisExpression(prop.path)
  const right = utils.logicalOr(
    utils.memberExpression(`opts.${prop.path}`, true)
  , utils.identifier('undefined')
  )

  return utils.expressionStatement(left, right)
}

function addValidation(bodyNode, validNode, obj) {
  checks.checkValidation(obj)
  typeofCheckForPath(obj, bodyNode, validNode)
  return obj.type
}

function typeofCheckForPath(opts, bodyNode, body) {
  const pe = new PathEach(opts)
  const topLevel = pe.topLevel

  pe.on('single', (obj) => {
    bodyNode.push(getDeclaration(opts))
    addSingleTypeofCheck(obj, body)
  }).on('nested', (obj) => {
    if (!decls.has(topLevel)) {
      decls.set(topLevel, [])
    }

    // We don't add the declaration here because we have to make
    // sure we have processed all of the nested members.
    // So, just add the typeof check
    addSingleTypeofCheck(obj, body)
  }).on('end', () => {
    if (pe.nested)
      decls.get(topLevel).push(pe.current.replace(`${topLevel}.`, ''))
  }).process()
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

function getValidVars() {
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
  return v
}
