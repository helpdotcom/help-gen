'use strict'

const TYPES = require('./types')
const utils = require('./utils')
const assertProp = require('./assert-prop')

const NEED_HELP_IS = TYPES.NEED_HELP_IS
const propToJSON = utils.propToJSON
const propSort = utils.propSort
const isObjectPath = utils.isObjectPath
const getParentPath = utils.getParentPath
const getLoopVar = utils.getLoopVar
const maybeStripLoopVar = utils.maybeStripLoopVar

class Transformer {
  constructor(properties) {
    this._out = []
    this.deps = {
      is: false
    , has: false
    }

    this._props = properties.slice()
    this.props = new Map()
    this.preprocess()
  }

  // Normalize all props to objects
  preprocess() {
    for (const nanoProp of this._props) {
      const prop = propToJSON(nanoProp)
      this.addNormalizedProp(prop)
    }
  }

  maybeCreateParentObject(prop) {
    const parentPath = getParentPath(prop.path)
    if (!parentPath) return prop

    if (this.props.has(parentPath)) {
      const parentProp = this.props.get(parentPath)
      if (prop.required && !parentProp.required) {
        if (maybeStripLoopVar(parentProp) === parentPath)
          parentProp.required = true
      }

      for (const child of parentProp.children) {
        if (child.path === prop.path) {
          return prop
        }
      }
      parentProp.children.push(prop)
      return prop
    }

    const parent = this.maybeCreateParentObject({
      path: parentPath
    , required: prop.required
    , type: 'object'
    , children: []
    })

    this.props.set(parent.path, parent)

    parent.children.push(prop)

    return prop
  }

  addNormalizedProp(prop) {
    if (NEED_HELP_IS.has(prop.type)) {
      this.deps.is = true
    }
    assertProp(prop)

    if (!prop.required) {
      this.deps.has = true
    }

    if (prop.type === 'ref') {
      const er = new Error('NanoProp.ref() is not supported')
      er.prop = prop
      throw er
    }

    this.props.set(prop.path, prop)

    if (prop.type === 'object' && prop.props) {
      for (const child of prop.props) {
        child.path = `${prop.path}.${child.path}`
        this.addNormalizedProp(child)
      }
    }

    if (prop.type === 'array' && prop.props) {
      const loopVar = getLoopVar(prop.path)
      const p = prop.props
      p.path = `${prop.path}.${loopVar}`
      p.required = true
      p.allowNull = false

      this.addNormalizedProp(p)
      prop.props = null
    }
  }

  transform() {
    for (const prop of this.props.values()) {
      this.maybeCreateParentObject(prop)
    }
    const vals = Array.from(this.props.values())
    const out = vals.filter((item) => {
      return !isObjectPath(item.path)
    })
    out.sort(propSort)
    out.deps = this.deps
    return out
  }
}

module.exports = function transformProps(props) {
  return new Transformer(props).transform()
}
