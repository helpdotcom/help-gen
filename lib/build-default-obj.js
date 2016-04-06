'use strict'

// Takes an array of strings that are object-paths and manipulates them
// into AST nodes for an object. This file simply creates an object literal.
//

const ast = require('./ast')
const is = require('v8is')
// props must be an array of strings that are object-paths
//
// For example, if you pass in the following as props,
//
//    ['id', 'name', 'room.id']
//
// You would get the ast for an object that looks like this:
//
//    {
//      id: undefined
//    , name: undefined
//    , room: {
//        id: undefined
//      }
//    }
//
// TODO(evanlucas) make this *not* O(n^2)
module.exports = function buildObject(props) {
  const map = transform(props)
  return processMap(map)
}

function processMap(map) {
  const out = []

  for (const item of map) {
    const key = item[0]
    const val = item[1]
    if (is.isMap(val)) {
      const nodes = processMap(val)
      const objectNode = ast.objectExpression(nodes)
      const node = defineASTProperty(key, objectNode)
      out.push(node)
    } else {
      let id
      // Set the property's value.
      // If it is a string or a number, it must be a literal.
      // If it is a boolean, it must be an identifier.
      // Otherwise, we default to undefined
      if (typeof val === 'string') {
        id = ast.literal(val, `'${val}'`)
      } else if (typeof val === 'number') {
        id = ast.literal(val, val)
      } else if (typeof val === 'boolean') {
        id = ast.identifier(Boolean(val))
      } else {
        id = ast.identifier(undefined)
      }
      const node = defineASTProperty(key, id)
      out.push(node)
    }
  }

  return out
}

function transform(props) {
  const map = new Map()
  // _map_ holds nodes
  // key is the topLevel path
  // value is either undefined or a set
  // if value is a set, it will be a set of maps just like this one
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    let name = prop
    let example = undefined
    // If object, then use prop.example as an example for this attribute.
    // This part will only be used by the documentation generator.
    if (typeof prop === 'object') {
      name = prop.path
      example = prop.example
    }

    addProperty(name, map, example)
  }
  return map
}

function addProperty(prop, map, example) {
  if (~prop.indexOf('.')) {
    const splits = prop.split('.')
    const topLevel = splits.shift()
    if (!map.has(topLevel)) {
      map.set(topLevel, new Map())
    }

    addProperty(splits.join('.'), map.get(topLevel), example)
  } else {
    map.set(prop, example)
  }
}

function defineASTProperty(path, val) {
  return ast.property(
    ast.identifier(path)
  , val
  , 'init'
  )
}