'use strict'

const Builder = require('@helpdotcom/build-ast')
const AST = Builder.ast
const E = AST.expression

module.exports = function buildObject(parent) {
  const props = []
  const children = Array.isArray(parent.children)
    ? parent.children
    : []
  for (const prop of children) {
    const last = Builder.id(prop.path.split('.').pop())
    if (prop.type === 'object') {
      const def = AST.property(last, buildObject(prop))
      props.push(def)
    } else {
      const def = AST.property(last, Builder.id('undefined'))
      props.push(def)
    }
  }

  return E.OBJECT(props)
}
