'use strict'

const EventEmitter = require('events')
const Builder = require('@helpdotcom/build-ast')
const Definition = require('./definition')
const toCode = require('../to-code')
const utils = require('../utils')
const lazyExport = utils.lazyExport

// { root: path      // the root path of the models directory
// , configs: Array  // array of all model config objects
// }

module.exports = class Manager extends EventEmitter {
  constructor(options) {
    super()

    const opts = Object.assign({
      root: process.cwd()
    }, options)

    this.factory = new Map()
    this.results = new Map()
    this.root = opts.root

    if (Array.isArray(opts.configs)) {
      this._loadConfigs(opts.configs)
    }

    this._indexBuilder = Builder().use('strict')
  }

  define(conf) {
    const def = new Definition(conf)
    if (this.factory.has(def.name)) {
      throw new Error(`Model "${def.name}" has already been defined.`)
    }
    this.factory.set(def.name, def)
    return def
  }

  _loadConfigs(configs) {
    for (const conf of configs) {
      this.define(conf)
    }
  }

  _addResult(name, filename, ast) {
    this.results.set(name, {
      code: utils.fixup(toCode(ast))
    , filename: filename
    })
  }

  _generateModels() {
    for (const model of this.factory.values()) {
      const { name, type } = model
      this._indexBuilder.push(lazyExport(name, `./${utils.filename(type)}`))
      const ast = model.generate()
      this._addResult(name, model.filename, ast)
    }

    this._addResult('Index', 'index.js', this._indexBuilder.program())
  }

  // Returns a Map [name, {code, filename}]
  generate() {
    this._generateModels()

    return this.results
  }
}
