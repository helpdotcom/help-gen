'use strict'

const Builder = require('@helpdotcom/build-ast')
const crypto = require('crypto')

module.exports = class TopLevelVariableGroup {
  constructor() {
    this._variables = new Map()
  }

  add(contentIdentifier, astNode, forcedVariableName = undefined) {
    // Use content-addressing for the global variables to avoid duplication.
    // The extra hashing step has an overhead on the order of ~50 µs, so that
    // should not create any performance trouble.

    const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(contentIdentifier), 'utf8')
        .digest()
        .toString('hex')
        .slice(0, 12)

    const existing = this._variables.get(hash)
    if (existing !== undefined)
      return existing.variableName

    const variableName = forcedVariableName || `_${hash}`
    this._variables.set(hash, {
      variableName
    , astNode
    })

    return variableName
  }

  build() {
    const b = Builder()

    for (const { variableName, astNode } of this._variables.values()) {
      b.declare('const', variableName, astNode)
    }

    return b.build()
  }
}
