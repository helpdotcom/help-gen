'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath
const S = Builder.ast.statement
const E = Builder.ast.expression
const B = Builder.block

module.exports = class ArrayCheck extends Base {
  _getIdxVar() {
    const idx = utils.getLoopIndex(this.path)
    return `__IDX__${idx}`
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
    b.if(test, B(block))

    if (!this.prop.props) return b.build()

    const childPath = `${this.path}.^${this._getIdxVar()}`

    const forBody = this.validator.addCheck(this.prop.props, childPath)
    b.push(this._getForLoop(forBody))
    return b.build()
  }

  _generateOptional() {
    const has = this._getHasOwnProperty()
    if (has) {
      return Builder()
          .if(this._getHasOwnProperty(), B(this._generateRequired()))
          .build()
    } else {
      return this._generateRequired()
    }
  }
}
