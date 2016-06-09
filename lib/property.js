'use strict'

module.exports = function property(prop) {
  if (prop.type === 'enum') {
    const out = Object.assign({}, {
      type: 'enum'
    , path: prop.path
    , values: prop.values || prop.value
    , example: prop.example
    })

    if (prop.description) out.description = prop.description
    if (!out.example) {
      out.example = out.values[0]
    }
    return out
  }

  return Object.assign({}, prop)
}
