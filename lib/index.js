'use strict'

const Builder = require('@helpdotcom/build-ast')
const Prop = require('@helpdotcom/nano-prop')
const utils = require('./utils')
const toCode = require('./to-code')
const Validator = require('./validator')
const TopLevelVariableGroup = require('./top-level-vars')
const extractDependencies = require('./extract-dependencies')

module.exports = class File {
  constructor(options) {
    const opts = Object.assign({
      multi: false
    , stripExtraneousProperties: false
    , failOnExtraneousProperties: false
    , resultVar: undefined
    , synchronousReturn: false
    }, options)

    if (!opts.name || !utils.isValidIdentifier(opts.name)) {
      throw new Error('name is required and must be a valid identifier')
    }
    if (!opts.type || typeof opts.type !== 'string') {
      throw new TypeError('type is required and must be a string')
    }
    if (typeof opts.synchronousReturn !== 'boolean') {
      throw new TypeError('synchronousReturn is required and must be a boolean')
    }
    if (opts.resultVar && typeof opts.resultVar !== 'string') {
      throw new TypeError('resultVar is optional but must be a string')
    }
    if (!Array.isArray(opts.props)) {
      throw new TypeError('props is required and must be an array')
    }

    this.name = opts.name
    this.type = opts.type
    this.multi = opts.multi
    this.stripExtraneousProperties = opts.stripExtraneousProperties
    this.failOnExtraneousProperties = opts.failOnExtraneousProperties
    this.resultVar = opts.resultVar
    this.synchronousReturn = opts.synchronousReturn
    this.props = opts.props.map((prop) => {
      if (Prop.isProp(prop)) {
        return prop
      }

      return Prop.fromConfig(prop)
    })

    this.builder = Builder().use('strict')
    // Holds all of the variables that are declared in this file
    this.variables = new TopLevelVariableGroup()

    const deps = extractDependencies(...this.props)

    if (deps.is) {
      this.variables.add('__helpdotcom_is'
                       , Builder.require('@helpdotcom/is')
                       , 'validators')
    }

    if (deps.has) {
      this.variables.add('__helpdotcom_has'
                       , utils.getHasOwnProperty()
                       , 'has')
    }
  }

  generateRaw() {
    const validator = this._getValidator()

    const rawBody = validator.buildRaw()

    return {
      rawBody
    , functionBody: validator.build(rawBody)
    , topLevelVars: this.variables
    }
  }

  generate() {
    const { functionBody, topLevelVars } = this.generateRaw()

    const out = Builder().use('strict')
        .module(this.name)
        .push(...topLevelVars.build())
        .push(this.getFunction(this.name, functionBody))
        .program()

    return utils.fixup(toCode(out))
  }

  getFunction(name, body) {
    return Builder.function(name, [
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
    , resultVar: this.resultVar
    , synchronousReturn: this.synchronousReturn
    }, this)
  }

  listPropTree() {
    return this._getValidator().getRootCheck().listTree()
  }
}
