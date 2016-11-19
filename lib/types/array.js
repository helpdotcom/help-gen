'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const utils = require('../utils')
const OP = Builder.objectPath
const S = Builder.ast.statement
const E = Builder.ast.expression
const B = Builder.block

const PRETTY_LOOP_VAR_START = 'i'.charCodeAt(0)

module.exports = class ArrayCheck extends Base {
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
    b.if(test, B(block))

    if (!this.prop.props) {
      b.push(...super._afterSuccessfulComparison())
      return b.build()
    }

    const childPath = `${this.path}.^${this._getIdxVar()}`

    if (this.validator.stripExtraneousProperties) {
      b.push(...this._assignToTargetVariable(Builder.new('Array', [
        OP(`${this.path}.length`)
      ])))
    }

    const forBody =
        this.validator.addCheck(this.prop.props
                              , childPath
                              , `${this._targetVarName}.^${this._getIdxVar()}`
                              , `${this.displayPath}[${this._prettyLoopVar()}]`
                              , this)

    b.push(this._getForLoop(forBody))
    return b.build()
  }

  _afterSuccessfulComparison() {
    return []
  }

  _getChildLoopIndex() {
    return this._loopIndex + 1
  }
}
