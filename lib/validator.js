'use strict'

const escodegen = require('escodegen')
const parse = require('acorn').parse
const fs = require('fs')
const path = require('path')
const utils = require('./ast')
const PathEach = require('./path-each')
const checks = require('./checks')
const baseFile = path.join(__dirname, 'base_validator.js')
const base = fs.readFileSync(baseFile, 'utf8')

const genOpts = utils.genOpts

function Validator(name, props) {
  if (!(this instanceof Validator))
    return new Validator(name, props)

  if (!name) {
    throw new Error('name is required')
  }

  // props instanceof Array is ~15% faster but will not
  // work if the array was created in a different context.
  // That shouldn't be a problem here, but isn't worth risking.
  if (!Array.isArray(props)) {
    throw new TypeError('props must be an array')
  }

  this.name = name
  this.props = props
  this.toChecks = new Map([ ['this', true] ])
  this.variables = new Map()
  this._currentVar = 0

  const ast = parse(base, {
    ecmaVersion: 6
  })

  this.ast = ast
}

Validator.prototype.nextVar = function nextVar() {
  return `___${this._currentVar++}`
}

Validator.prototype._addRegExp = function _addRegExp(re) {
  const str = re.toString()
  if (this.variables.has(str)) {
    return this.variables.get(str).name
  }

  const varName = this.nextVar()

  const out = {
    name: varName
  , node: null
  }

  this.variables.set(str, out)
  const ast = this.ast

  // this assumes that every re starts with `/`
  let pattern = str.slice(1)

  // it sure as hell would be nice if RegExp.prototype.flags was
  // implemented in v8 :[
  const flags = str.match(/[gimuy]*$/)[0]
  if (flags.length)
    pattern = pattern.slice(0, -flags.length - 1) // include trailing slash
  else
    pattern = pattern.slice(0, -1)
  const reNode = utils.regex(new RegExp(pattern, flags), re.toString(), pattern, flags)
  const node = utils.declareVar(varName, reNode, 'const')
  out.node = node

  return varName
}

Validator.prototype._injectVars = function _injectVars() {
  const ast = this.ast
  const body = ast.body
  const usestrict = body.shift()

  for (const v of this.variables.values()) {
    const node = v.node
    body.unshift(node)
  }

  body.unshift(usestrict)
}

Validator.prototype.generate = function generate() {
  const ast = this.ast
  const name = this.name
  const props = this.props

  // shift off 'use strict'
  // we will add it back after processing
  const useStrict = ast.body.shift()

  // shift off the two that are only used for dates
  const tld = ast.body.shift()
  const emailRE = ast.body.shift()

  // ast.body[0] is the default that already exists
  // it checks (!obj || typeof obj !== 'object')
  const bodyNode = ast.body[0]

  // ast.body[1] is isDate()
  // ast.body[2] is isv4UUID()
  // ast.body[3] is isUUID()
  // ast.body[4] is isEmail()

  const isUUID = ast.body.pop()
  const isUUIDv4 = ast.body.pop()
  const isDate = ast.body.pop()
  const isEmail = ast.body.pop()

  const right = bodyNode.expression.right
  right.id.name = name

  const functionBody = right.body.body
  let hasDate = false
  let hasUUID = false
  let hasEmail = false
  for (let i = 0; i < props.length; i++) {
    var type = this.addValidator(props[i])
    if (type === 'date') hasDate = true
    if (type === 'uuid') hasUUID = true
    if (type === 'email') hasEmail = true
  }

  functionBody.push(utils.returnCB())

  // if we added an email type, then add back the required requires
  if (hasEmail) {
    ast.body.unshift(emailRE)
    ast.body.unshift(tld)
    ast.body.push(isEmail)
  }

  if (hasDate) {
    ast.body.push(isDate)
  }

  if (hasUUID) {
    ast.body.push(isUUIDv4)
    ast.body.push(isUUID)
  }

  // add 'use strict' back
  ast.body.unshift(useStrict)

  this._injectVars()

  this._cleanup()
  return fixup(escodegen.generate(ast, genOpts))
}

Validator.prototype._cleanup = function _cleanup() {
  this.toChecks.clear()
  this.variables.clear()
}

module.exports = function createValidator(name, props) {
  return new Validator(name, props).generate()
}

// obj:
//
//  { name: 'the parameter name' (string)
//  , type: 'the data type of the parameter' (string)
//  , path: 'the dot delimited json path (ex. body.id)' (string)
//  , required: 'is this a required param?' (boolean)
//  }
Validator.prototype.addValidator = function addValidator(obj) {
  const ast = this.ast
  checks.checkValidation(obj)

  if (!obj.hasOwnProperty('required')) {
    throw new Error('Invalid rule. `required` is required')
  }

  if (obj.required) {
    this.typeofCheckForPath(obj)
    return obj.type
  }
}

Validator.prototype.typeofCheckForPath = function typeofCheckForPath(opts) {
  const pe = new PathEach(opts)
  pe.on('single', (obj) => {
    this.addSingleTypeofCheck(obj)
  }).on('nested', (obj) => {
    this.addSingleTypeofCheck(obj)
  }).process()
}

Validator.prototype.addSingleTypeofCheck = function addSingleTypeofCheck(opts) {
  const toChecks = this.toChecks
  if (toChecks.has(opts.path)) {
    return
  }
  const ast = this.ast
  const right = ast.body[0].expression.right
  const body = right.body.body
  toChecks.set(opts.path, true)
  // date, uuid
  if (checks.isBuiltinType(opts.type)) {
    let v = this.nextVar()
    let mem = utils.typeofExpression(
      utils.memberExpression(opts.path)
    )
    body.push(utils.declareVar(v, mem, 'const'))
    body.push(utils.valTypeofCheck(opts.name, opts.type, opts.path, v))
  } else if (checks.isCustomType(opts.type)) {
    if (opts.type === 'regex') {
      if (!opts.value) {
        throw new Error('value must be defined for type: regex')
      }
      let v = this._addRegExp(opts.value)
      body.push(utils.valRegexCheck(v, opts.path))
    } else {
      body.push(utils.valTypeofCheck(opts.name, opts.type, opts.path))
    }
  } else {
    throw new Error(`Invalid type: ${opts.type}. Implement me`)
  }
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
