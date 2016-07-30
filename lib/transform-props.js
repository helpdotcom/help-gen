'use strict'

// Takes in a single level array of Prop objects
// Returns an array of objects that can have nested `children`
//
// 'id', 'admin.id', 'admin.email'
//
//
// 'id' => object
// 'admin' => object
//   .children => [
//     'id' => object
//     'email' => object
//    ]
//

const checks = require('./checks')
const NanoProp = require('@helpdotcom/nano-prop/lib/base')

class Transformer {
  constructor(properties) {
    this._out = []
    this.parents = new Map()
    this.props = sorted(properties)
  }

  _addProp(prop) {
    if (prop.type === 'array' && prop.props) {
      if (prop.props instanceof NanoProp) {
        prop.props.required(true)
      }
    }
    const parentPath = getParentPath(prop.path)
    if (!parentPath) {
      prop.children = []
      this.parents.set(prop.path, prop)
      return prop
    }

    var parent = this.parents.get(parentPath)
    if (!parent) {
      parent = this._addProp({
        children: []
      , path: parentPath
      , required: prop.required
      , type: 'object'
      })

      if (!getParentPath(parentPath))
        this.parents.set(parentPath, parent)
    }

    parent.children.push(prop)
    if (!parent.required && prop.required)
      parent.required = true

    if (!prop.children) prop.children = []

    return prop
  }

  _generate() {
    const out = Array.from(this.parents.values())

    out.sort(propSort)
    return out
  }

  transform() {
    for (const prop of this.props) {
      this._addProp(prop)
    }

    return this._generate()
  }
}

module.exports = function transformProps(properties) {
  return new Transformer(properties).transform()
}

function sorted(properties) {
  const props = properties.map((item) => {
    if (item.toJSON) item = item.toJSON()
    checks.checkValidation(item)
    return Object.assign({}, item)
  })
  props.sort(propSort)

  return props
}

function propSort(a, b) {
  return a.path < b.path
    ? -1
    : a.path > b.path
    ? 1
    : 0
}

function isObjectPath(path) {
  return path.indexOf('.') !== -1
}

function getParentPath(path) {
  if (!isObjectPath(path)) return null
  const splits = path.split('.')
  splits.pop()
  return splits.join('.')
}
