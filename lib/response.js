'use strict'

const utils = require('./ast')
const generator = require('./generate').generate
const PathEach = require('./path-each')
const checks = require('./checks')
const buildObj = require('./build-default-obj')
const Builder = require('@helpdotcom/build-ast')
const AST = Builder.ast
const E = AST.expression
const UNARY = E.UNARY

function Response(name, props) {
  if (!(this instanceof Response))
    return new Response(name, props)

  checks.checkName(name)

  if (!Array.isArray(props)) {
    throw new TypeError('props must be an array')
  }

  this.name = name
  this.props = props
  this.toChecks = new Map([ ['this', true] ])
  this.decls = new Map()
  this._currentVar = 0

  this.builder = Builder().use('strict')

  // Hold require statements
  this.builder1 = Builder()

  // Holds constructor, fromRow, and isValid
  this.builder2 = Builder()

  this.types = null
}

Response.prototype.nextVar = function nextVar() {
  return `___${this._currentVar++}`
}

Response.prototype._processModule = function _processModule() {
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

Response.prototype._processBody = function _processBody() {
  const name = this.name
  const props = this.props

  const optsProps = [Builder.assign('opts', Builder.or(
    AST.objectPath('opts')
  , AST.objectPath('{}')
  ))]

  const isValidProps = [getValidVars()]

  for (let i = 0; i < props.length; i++) {
    this.addValidation(props[i], optsProps, isValidProps)
  }

  isValidProps.push(utils.returnOut())

  // now, process all of the object-level declarations
  for (const decl of this.decls) {
    // decl is an array of arrays of properties that should default to undefined
    // decl[0] is the property name
    // decl[1] is an array of the sub property names

    const subprops = buildObj(decl[1])
    const obj = E.OBJECT(subprops)
    const left = `this.${decl[0]}`
    const right = Builder.or(
      AST.objectPath(`opts.${decl[0]}`)
    , obj
    )
    optsProps.push(Builder.assign(left, right))
  }

  this.builder2
    .module(name)
    .function(name, ['opts'], optsProps)
    .assign(`${name}.fromRow`, Builder.function('fromRow', ['opts'], [
      Builder.returns(Builder.new(name, ['opts']))
    ]))
    .assign(`${name}.prototype.isValid`, Builder.function('isValid',
      [], isValidProps
    ))
}

Response.prototype.generate = function generate() {
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

/*
* @argument obj   Object requiring validation
* @argument a     optsProps
* @argument b     isValidProps
*/
Response.prototype.addValidation = function addValidation(obj, a, b) {
  checks.checkValidation(obj)
  this.typeofForPath(obj, a, b)
}

/*
* @argument obj   Object to declare and type-check
* @argument a     optsProps
* @argument b     isValidProps
*/
Response.prototype.typeofForPath = function typeofForPath(opts, a, b) {
  const decls = this.decls

  const pe = new PathEach(opts)
  const topLevel = pe.topLevel

  pe.on('single', (obj) => {
    a.push(getDeclaration(opts))
    this.addSingleTypeofCheck(obj, b)
  }).on('nested', (obj) => {
    if (!decls.has(topLevel)) {
      decls.set(topLevel, [])
    }

    // We don't add the declaration here because we have to make
    // sure we have processed all of the nested members.
    // So, just add the typeof check
    this.addSingleTypeofCheck(obj, b)
  }).on('end', () => {
    if (pe.nested)
      decls.get(topLevel).push(pe.current.replace(`${topLevel}.`, ''))
  }).process()
}

Response.prototype._addEnum = function _addEnum(prop) {
  const name = prop.path.replace(/[\.\s\-,]/g, '')

  const items = prop.value.map((item) => {
    if (typeof item === 'string') return Builder.string(item)
    if (typeof item === 'number') return Builder.number(item)
    throw new TypeError('Invalid type. Item must be a string or number.')
  })

  const node = Builder.array(items)
  const varName = `ENUM_${name}`
  this.builder1.declare('const', varName, node)

  return varName
}

/*
* @argument o     Object to type-check
* @argument b     isValidProps
*/
Response.prototype.addSingleTypeofCheck = function addSingleTypeofCheck(o, b) {
  const opts = o
  const toChecks = this.toChecks
  if (toChecks.has(opts.path)) {
    return
  }

  const builder = Builder()

  toChecks.set(opts.path, true)
  // date, uuid
  if (checks.isBuiltinType(opts.type)) {
    let v = this.nextVar()
    let mem = Builder.typeof(`this.${opts.path}`)
    builder
      .declare('const', v, mem)
      .body.push(utils.resTypeofCheck(opts.type, opts.path, v))
  } else if (checks.isCustomType(opts.type)) {
    if (opts.type !== 'enum') {
      builder.body.push(utils.resTypeofCheck(opts.type, opts.path))
    } else {
      const v = this._addEnum(opts)
      const poss = opts.value.map((item) => {
        return JSON.stringify(item)
      }).join(', ')
      const er = `property "${opts.path}" is invalid. Must be one of [${poss}]`
      builder.ifNot(
        UNARY('~', Builder.callFunction(`${v}.indexOf`, [
          AST.objectPath(`this.${opts.path}`)
        ]))
      , utils.getInvalidBlocks(Builder.string(er))
      )
    }
  } else {
    throw new Error(`Invalid type: ${opts.type}. Implement me`)
  }

  builder.body.forEach((item) => {
    b.push(item)
  })
}

module.exports = function createResponse(name, props) {
  return new Response(name, props).generate()
}

module.exports.Response = Response

function fixup(str) {
  return str
    .replace('\'use strict\';', '\'use strict\'\n')
    .replace(/module\.exports = ([\w]+);$/mi, 'module.exports = $1\n')
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/;$/gm, '')
}

function getDeclaration(prop) {
  const left = `this.${prop.path}`
  const right = AST.objectPath(`opts.${prop.path}`)

  return Builder.assign(left, right)
}

function getValidVars() {
  const exp = E.OBJECT([
    AST.property(
      AST.identifier('valid')
    , AST.literal(true)
    )
  , AST.property(
      AST.identifier('msg')
    , AST.literal('', '\'\'')
    )
  ])

  const v = Builder.declare('const', 'out', exp)
  return v
}
