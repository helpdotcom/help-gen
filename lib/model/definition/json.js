'use strict'

const Builder = require('@helpdotcom/build-ast')
const AST = Builder.ast
const E = AST.expression
const S = AST.statement

module.exports = class Json {
  constructor(model) {
    this.model = model
    this.builder = Builder()

    if (this.model.includeType) {
      this.addItem({ path: 'type' })
    }
  }

  // This can only be called for top-level items
  addItem(prop) {
    const p = AST.property(
      Builder.objectPath(prop.path)
    , Builder.objectPath(`this.${prop.path}`)
    )
    this.builder.push(p)
  }

  build() {
    const body = this.builder.build()
    const b = Builder()
    b.push(S.EXPRESSION(Builder.callFunction('this._validate', [])))
    b.returns(E.OBJECT(body))
    return b.build()
  }
}
