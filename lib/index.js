'use strict'

const Builder = require('@helpdotcom/build-ast')
const transform = require('./transform-props')
const utils = require('./utils')
const toCode = require('./to-code')
const Validator = require('./validator')

module.exports = class File {
  constructor(options) {
    const opts = Object.assign({
      multi: false
    }, options)

    if (!opts.name || !utils.isValidIdentifier(opts.name)) {
      throw new Error('name is required and must be a valid identifier')
    }
    if (!opts.type || typeof opts.type !== 'string') {
      throw new TypeError('type is required and must be a string')
    }
    if (!Array.isArray(opts.props)) {
      throw new TypeError('props is required and must be an array')
    }

    this.name = opts.name
    this.type = opts.type
    this.multi = opts.multi
    this.props = transform(opts.props)
    this._currentVar = 0

    this.builder = Builder().use('strict')
    // Holds all of the variables that are declared in this file
    this.variables = new Map()
    this.variableNames = new Map()
    this.functions = new Map()
    this.functionNames = new Map()

    if (this.props.deps.is) {
      this.builder
        .declare('const', 'validators', Builder.require('@helpdotcom/is'))
    }

    if (this.props.deps.has) {
      this.builder.push(utils.declareHas())
    }
  }

  reset() {
    this.builder = Builder().use('strict')
    this.variables.clear()
    this.variableNames.clear()
  }

  generate() {
    this.builder.module(this.name)
    this._process()
    const out = this.builder.program()
    this.reset()
    return utils.fixup(toCode(out))
  }

  addFunction(name, body) {
    this.builder.function(name, [
      'obj'
    , 'cb'
    ], body)
  }

  _process() {
    const v = new Validator({
      name: this.name
    , type: this.type
    , props: this.props
    , multi: this.multi
    }, this)

    this.addFunction(this.name, v.build())
  }

  nextVar() {
    return `___${this._currentVar++}`
  }

  declareTopLevelVar(prop, varName, node) {
    this.builder.declare('const', varName, node)
    this.variables.set(varName, {
      name: varName
    , node: node
    })
    this.variableNames.set(prop.path, varName)
    return varName
  }

  hasVarForProp(prop) {
    return this.variableNames.has(prop.path)
  }
}
