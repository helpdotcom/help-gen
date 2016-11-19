'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath
const S = Builder.ast.statement
const E = Builder.ast.expression
const B = Builder.block
const { getCheck } = require('./')

const PRETTY_LOOP_VAR_START = 'i'.charCodeAt(0)

module.exports = class ArrayCheck extends Base {
  constructor(conf, ...args) {
    super(conf, ...args)

    this.skipTypeof = conf.skipTypeof || false
  }

  _getIdxVar() {
    return `__IDX__${this._loopIndex}`
  }

  _prettyLoopVar() {
    const idx = this._loopIndex
    return String.fromCharCode(PRETTY_LOOP_VAR_START + idx - 1)
  }

  _getForLoop(body) {
    const idxVar = this._getIdxVar()
    const id = Builder.id(idxVar)
    return S.FOR(
      Builder.declare('var', idxVar, Builder.number(0))
    , E.BINARY(id, '<', OP(`${this.path}.length`))
    , E.UPDATE('++', id, false)
    , B(body)
    )
  }

  _generateRequired() {
    const b = Builder()
    const test = this._getTypeof()
    const block = utils.callbackWithError(this._getError())

    if (!this.skipTypeof) {
      b.if(test, B(block))
    }

    if (!this.prop.props) {
      b.push(...super._afterSuccessfulComparison())
      return b.build()
    }

    if (this.validator.stripExtraneousProperties) {
      b.push(...this._assignToTargetVariable(Builder.new('Array', [
        OP(`${this.path}.length`)
      ])))
    }

    const forBody = this._getChild().generate()

    b.push(this._getForLoop(forBody))
    return b.build()
  }

  _afterSuccessfulComparison() {
    return []
  }

  _getChildLoopIndex() {
    return this._loopIndex + 1
  }

  _getChild() {
    return getCheck({
      prop: this.prop.props
    , path: `${this.path}.^${this._getIdxVar()}`
    , storeResultIn: `${this._targetVarName}.^${this._getIdxVar()}`
    , displayPath: `${this.displayPath}[${this._prettyLoopVar()}]`
    , parentCheck: this
    })
  }

  _getChildren() {
    if (!this.prop.props) {
      return []
    }

    return [this._getChild()]
  }
}
