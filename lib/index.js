'use strict'

const Builder = require('@helpdotcom/build-ast')
const Prop = require('@helpdotcom/nano-prop')
const utils = require('./utils')
const toCode = require('./to-code')
const Validator = require('./validator')
const extractDependencies = require('./extract-dependencies')

module.exports = class File {
  constructor(options) {
    const opts = Object.assign({
      multi: false
    , stripExtraneousProperties: false
    , failOnExtraneousProperties: false
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
    this.stripExtraneousProperties = opts.stripExtraneousProperties
    this.failOnExtraneousProperties = opts.failOnExtraneousProperties
    this.props = opts.props.map((prop) => {
      if (Prop.isProp(prop)) {
        return prop
      }

      return Prop.fromConfig(prop)
    })
    this._currentVar = 0

    this.builder = Builder().use('strict')
    // Holds all of the variables that are declared in this file
    this.variables = new Map()

    const deps = extractDependencies(...this.props)

    if (deps.is) {
      this.builder
        .declare('const', 'validators', Builder.require('@helpdotcom/is'))
    }

    if (deps.has) {
      this.builder.push(utils.declareHas())
    }
  }

  reset() {
    this.builder = Builder().use('strict')
    this.variables.clear()
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

  _getValidator() {
    return new Validator({
      name: this.name
    , type: this.type
    , props: this.props
    , multi: this.multi
    , stripExtraneousProperties: this.stripExtraneousProperties
    , failOnExtraneousProperties: this.failOnExtraneousProperties
    }, this)
  }

  _process() {
    this.addFunction(this.name, this._getValidator().build())
  }

  listPropTree() {
    return this._getValidator().getRootCheck().listTree()
  }

  nextVar() {
    return `___${this._currentVar++}`
  }

  declareTopLevelVar(varName, node) {
    this.builder.declare('const', varName, node)
    this.variables.set(varName, {
      name: varName
    , node: node
    })
    return varName
  }
}
