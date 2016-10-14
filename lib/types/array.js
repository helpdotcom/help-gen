'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath
const S = Builder.ast.statement
const E = Builder.ast.expression
const B = Builder.block

module.exports = class ArrayCheck extends Base {
  constructor(...args) {
    super(...args)

    if (Array.isArray(this.prop.children)) {
      this.prop.children.sort(utils.propSort)
    }
    this._wrapped = this.validator._wrap(this.path)
  }

  _getForLoop(body) {
    const idx = utils.getLoopIndex(this.path)
    const idxVar = `__IDX__${idx}`
    const id = Builder.id(idxVar)
    return S.FOR(
      Builder.declare('var', idxVar, Builder.number(0))
    , E.BINARY(id, '<', OP(`${this._wrapped}.length`))
    , E.UPDATE('++', id, false)
    , B(body.build())
    )
  }

  _addNanoProps(body) {
    for (const item of this.prop.children) {
      this.validator.addCheck(item, body)
    }
  }

  _applyRequiredToBuilder(b) {
    const test = this._getTypeof()
    const block = utils.callbackWithError(this._getError())
    b.if(test, B(block))

    if (!this.prop.children.length) return

    const forBody = Builder()
    this._addNanoProps(forBody)
    b.push(this._getForLoop(forBody))
  }

  _generateRequired() {
    this._applyRequiredToBuilder(this.builder)
  }

  _generateOptional() {
    const b = Builder()
    this._applyRequiredToBuilder(b)
    const has = this._getHasOwnProperty()
    if (has) {
      this.builder.if(this._getHasOwnProperty(), B(b.build()))
    } else {
      this.builder.push(...b.build())
    }
  }
}
