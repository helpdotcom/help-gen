'use strict'

const Builder = require('@helpdotcom/build-ast')
const utils = require('../../utils')
const Validator = require('../../validator')
const Json = require('./json')

module.exports = class Definition {
  constructor(options, manager) {
    const opts = Object.assign({}, options)

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
    this.filename = `${utils.filename(this.type)}.js`
    this.includeType = !!opts.includeType
    this.manager = manager
    this._props = opts.props

    this.builder = Builder().use('strict')
    this.klazz = Builder
      .class()
      .expression(this.name)
  }

  // Returns the AST for this model
  generate() {
    const klazz = Builder
      .class()
      .expression(this.name)

    const ctorOpts = {
      name: this.name
    , type: this.type
    , props: this._props
    , inputVar: 'opts'
    , resultVar: 'this'
    , synchronousReturn: true
    , performDeepClone: true
    , useObjectAssignForRoot: true
    , errorPrefix: `(${this.type}): Missing or invalid property:`
    , optionalsMayBeUndefined: true
    }

    const validateOpts = Object.assign({}, ctorOpts, {
      inputVar: 'this'
    , resultVar: 'this'
    , performDeepClone: false
    , optionalsMayBeUndefined: true
    })

    const ctorValidator = new Validator(ctorOpts)
    const ctor = ctorValidator.generateRaw()
    const validateValidator = new Validator(validateOpts)
    const validate = validateValidator.generateRaw()
    const json = new Json(this)

    for (const check of validateValidator.listPropTree()) {
      const path = check.path
      if (!path.startsWith('this.') || utils.isObjectPath(path.substr(5)))
        continue

      json.addItem(check.prop)
    }

    const typeAssignment = Builder.assign('this.type'
                                        , Builder.string(this.type))
    ctor.rawBody.unshift(typeAssignment)
    const returnThis = Builder.returns(Builder.id('this'))
    validate.rawBody.push(returnThis)

    klazz.ctor(['opts'], Builder.block(ctor.rawBody))
    klazz.method('toJSON', [], Builder.block(json.build()))
    klazz.method('_validate', [], Builder.block(validate.rawBody))

    const topLevelVars = ctor.topLevelVars.merge(validate.topLevelVars)

    return Builder()
      .use('strict')
      .push(...topLevelVars.build())
      .module(klazz.build())
      .program()
  }
}
