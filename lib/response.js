'use strict'

const escodegen = require('escodegen')
const parse = require('acorn').parse
const fs = require('fs')
const path = require('path')
const utils = require('./ast')
const baseFile = path.join(__dirname, 'base_response.js')
const base = fs.readFileSync(baseFile, 'utf8')

const genOpts = utils.genOpts

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
  ast.body[1].expression.right.name = name
  ast.body[2].id.name = name
  ast.body[3].expression.left.object.name = name
  ast.body[3].expression.right.body.body[0].argument.callee.name = name

  // this is where we will start adding properties
  const bodyNode = ast.body[2].body.body

  for (let i = 0; i < props.length; i++) {
    addDeclaration(bodyNode, props[i])
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
}

// If we want to allow the default value in the future,
// we will need to make prop be an object instead of a string
function addDeclaration(body, prop) {
  if (typeof prop !== 'string') {
    throw new TypeError(`Expected property to be string, got ${typeof prop}`)
  }
  const left = utils.thisExpression(prop)
  const right = utils.logicalOr(
    utils.memberExpression(`opts.${prop}`, true)
  , utils.identifier('undefined')
  )

  body.push(utils.thisAssignment(left, right))
}
