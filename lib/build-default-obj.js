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
      const node = defineASTProperty(key, ast.identifier(undefined))
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
    addProperty(prop, map)
  }
  return map
}

function addProperty(prop, map) {
  if (~prop.indexOf('.')) {
    const splits = prop.split('.')
    const topLevel = splits.shift()
    if (!map.has(topLevel)) {
      map.set(topLevel, new Map())
    }

    addProperty(splits.join('.'), map.get(topLevel))
  } else {
    map.set(prop, undefined)
  }
}

function defineASTProperty(path, val) {
  return ast.property(
    ast.identifier(path)
  , val
  , 'init'
  )
}
