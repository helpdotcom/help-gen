'use strict'

// Takes an array of strings that are object-paths and manipulates them
// into AST nodes for an object. This file simply creates an object literal.
//

const ast = require('./ast')
const Builder = require('@helpdotcom/build-ast')
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
      // Set the property's value.
      // If it is a string or a number, it must be a literal.
      // If it is a boolean, it must be an identifier.
      // Otherwise, we default to undefined
      const node = defineASTProperty(key, getValue(val))
      out.push(node)
    }
  }

  return out
}

function getValue(item) {
  if (Array.isArray(item)) {
    return ast.array(item.map((thing) => {
      return getValue(thing)
    }))
  } else if (item && typeof item === 'object') {
    // This is for examples. This should only be reached if an example
    // is an array of objects.
    return ast.objectExpression(Object.keys(item).map((key) => {
      if (typeof item[key] === 'object') {
        return getValue(item[key])
      }
      return ast.property(Builder.id(key), getValue(item[key]), 'init')
    }))
  } else {
    const t = typeof item
    switch (t) {
      case 'string':
        return Builder.string(item)
      case 'number':
        return Builder.number(item)
      case 'boolean':
        return Builder.id(Boolean(item))
      default:
        return Builder.id(undefined)
    }
  }
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
