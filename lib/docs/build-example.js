'use strict'

const uuid = require('node-uuid')

module.exports = function buildExample(props) {
  const out = {}
  for (const prop of props) {
    const p = Object.assign({}, prop)
    if (!p.hasOwnProperty('example')) {
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
          p.example = uuid.v4()
          break
        case 'enum':
          p.example = p.values[0]
          break
        case 'date':
          p.example = new Date().toISOString()
          break
        default:
          p.example = null
          break
      }
    }

    set(out, prop.path, p.example)
  }

  return out
}

function set(obj, path, value) {
  const splits = path.split('.')
  if (splits.length === 1) {
    obj[path] = value
    return
  }

  const tl = splits.shift()
  const o = obj[tl] || {}
  while (splits.length) {
    const key = splits.shift()
    o[key] = o[key] || {}
    set(o, splits.join('.'), value)
  }
  obj[tl] = o
}
