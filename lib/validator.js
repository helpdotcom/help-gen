'use strict'

const ast = require('./ast')
const generator = require('./generate').generate
const PathEach = require('./path-each')
const checks = require('./checks')
const Builder = require('@helpdotcom/build-ast')
const AST = Builder.ast
const E = AST.expression
const S = AST.statement

function Validator(name, props) {
  if (!(this instanceof Validator))
    return new Validator(name, props)

  checks.checkName(name)

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

  this.builder = Builder().use('strict')

  // Holds the require statements
  this.builder1 = Builder()

  // Holds the function body
  this.builder2 = Builder()

  // Holds all of the custom types we are using
  this.types = null
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

  const node = Builder.regex(re)
  this.builder1.declare('const', varName, node)
  this.variables.set(str, {
    name: varName
  , node: node
  })

  return varName
}

Validator.prototype._processModule = function _processModule() {
  const typeNames = checks.typeofs.custom
  const types = {}
  typeNames.forEach((item) => {
    types[item] = false
  })

  const props = this.props
  for (let i = 0; i < props.length; i++) {
    const item = props[i]
    if (checks.isCustomType(item.type)) {
      // add the necessary requires at the top
      types[item.type] = true
    }
  }

  if (types.email || types.date || types.uuid) {
    this.builder1
      .declare('const', 'validators', Builder.require('@helpdotcom/is'))
  }
  this.types = types
}

function returnImmediate(args) {
  return Builder.returns(Builder.callFunction('setImmediate', [
    E.ARROW([], Builder.block([
      S.EXPRESSION(Builder.callFunction('cb', args))
    ]))
  ]))
}

Validator.prototype._processBody = function _processBody() {
  const name = this.name

  const props = []

  props.push(Builder.if(
    E.LOGICAL(
      Builder.not(Builder.id('obj'))
    , '||'
    , E.BINARY(Builder.typeof('obj'), '!==', Builder.string('object'))
    )
  , Builder.block(returnImmediate([Builder.new('TypeError', [
      Builder.string('obj must be an object')
    ])]))
  ))


  this.props.forEach((item) => {
    checks.checkValidation(item)
    if (!item.hasOwnProperty('required')) {
      const n = item.name
      throw new Error(`Invalid rule. \`required\` is required. Missing ${n}`)
    }

    if (item.required)
      this.typeofCheckForPath(item, props)
  })

  props.push(returnImmediate([
    AST.literal(null)
  , Builder.id('obj')
  ]))

  this.builder2
    .module(name)
    .function(name, ['obj', 'cb'], props)
}

Validator.prototype.generate = function generate() {
  this._processModule()
  this._processBody()

  for (const item of this.builder1.body) {
    this.builder.body.push(item)
  }

  for (const item of this.builder2.body) {
    this.builder.body.push(item)
  }

  return fixup(generator(this.builder.program()))
}

module.exports = function createValidator(name, props) {
  return new Validator(name, props).generate()
}

module.exports.Validator = Validator

Validator.prototype.typeofCheckForPath = function typeofCheckForPath(opts, a) {
  const pe = new PathEach(opts)
  pe.on('single', (obj) => {
    this.addSingleTypeofCheck(obj, a)
  }).on('nested', (obj) => {
    this.addSingleTypeofCheck(obj, a)
  }).process()
}

Validator.prototype.addSingleTypeofCheck = function addSingleTypeofCheck(o, a) {
  const opts = o
  const toChecks = this.toChecks
  if (toChecks.has(opts.path)) {
    return null
  }

  const builder = Builder()

  toChecks.set(opts.path, true)
  // date, uuid
  if (checks.isBuiltinType(opts.type)) {
    let v = this.nextVar()
    builder
      .declare('const', v, Builder.typeof(`obj.${opts.path}`))
      .body.push(ast.valTypeofCheck(opts.name, opts.type, opts.path, v))
  } else if (checks.isCustomType(opts.type)) {
    if (opts.type === 'regex') {
      if (!opts.value) {
        throw new Error('value must be defined for type: regex')
      }
      let v = this._addRegExp(opts.value)
      // `Path` "${path}" must match `, null, varName
      const em = `Path "${opts.path}" must match `
      const err = Builder.new('Error', [
        AST.templateLiteral([Builder.id(v)], [
          AST.templateElement(em, em, false)
        , AST.templateElement('', '', true)
        ])
      ])

      builder.ifNot(
        Builder.callFunction(`${v}.test`, [
          AST.objectPath(`obj.${opts.path}`)
        ])
      , Builder.block(returnImmediate([err]))
      )
    } else {
      builder.body.push(ast.valTypeofCheck(opts.name, opts.type, opts.path))
    }
  } else {
    throw new Error(`Invalid type: ${opts.type}. Implement me`)
  }

  builder.body.forEach((item) => {
    a.push(item)
  })
}

function fixup(str) {
  return str
    .replace('\'use strict\';', '\'use strict\'\n')
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/\];$/gm, ']')
    .replace(/;$/gm, '')
}
