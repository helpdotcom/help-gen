'use strict'

const UUID = '885b440b-8b0e-445c-bd0f-b212ad0fdc41'
const DATE = '2016-06-26T18:26:44.105Z'
const objectPath = require('object-path')

module.exports = function buildExample(props) {
  const out = {}
  for (const nanoProp of props) {
    const prop = nanoProp.toJSON
      ? nanoProp.toJSON()
      : nanoProp

    const p = Object.assign({}, prop)

    if (!p.hasOwnProperty('example') || p.example == null) {
      switch (p.type) {
        case 'string':
          p.example = '<string>'
          break
        case 'number':
          p.example = 1
          break
        case 'boolean':
          p.example = false
          break
        case 'array':
          p.example = []
          break
        case 'object':
          p.example = {}
          break
        case 'uuid':
          p.example = UUID
          break
        case 'enum':
          p.example = p.values[0]
          break
        case 'date':
          p.example = DATE
          break
        default:
          p.example = null
          break
      }
    }

    objectPath.set(out, prop.path, p.example)
  }

  return out
}
