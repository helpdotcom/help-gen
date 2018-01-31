'use strict'

const Base = require('./base')
const INVALID_PROPS_ERROR = 'Prop.object().props() only accepts an array of ' +
  'NanoProps'
const PASSTHROUGH_ERROR = '.props() and .passthrough() are mutually exclusive'
const isProp = require('./is-prop')

class ObjectProp extends Base {
  constructor() {
    super()
    this._type = 'object'
    this._props = null
    this._passthrough = false
  }

  props(p) {
    if (!Array.isArray(p)) {
      throw new TypeError(INVALID_PROPS_ERROR)
    }
    for (var i = 0; i < p.length; i++) {
      if (!isProp(p[i])) {
        throw new TypeError(INVALID_PROPS_ERROR)
      }
    }
    if (p.length && this._passthrough) {
      throw new Error(PASSTHROUGH_ERROR)
    }

    if (!p.length) {
      this._props = []
    } else {
      this._props = createMissingParentProps(p)
    }
    return this
  }

  passthrough() {
    if (this._props && this._props.length) {
      throw new Error(PASSTHROUGH_ERROR)
    }

    this._passthrough = true
    return this
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      props: this._props && this._props.map((p) => { return p.toJSON() })
    , passthrough: this._passthrough
    })
  }
}

module.exports = ObjectProp

/*
 * It is possible to call `Prop.object().props(...)` with sub-properties whose
 * parents only implicitly exist, e.g.
 * with [ Prop.someType().path('foo')
 *      , Prop.someType().path('bar.baz')
 *      , Prop.someType().path('bar.quux') ].
 * This function adds the missing parents, e.g. transforms the above into
 * [ Prop.someType().path('foo')
 * , Prop.object().path('bar').props([
 *     Prop.someType().path('baz')
 *   , Prop.someType().path('quux')
 *   ])
 * ]
 */
function createMissingParentProps(props) {
  /* In the above example:
   * { 'foo' => [ ]
   * , 'bar' => [ Prop.someType().path('bar.baz')
   *            , Prop.someType().path('bar.quux') ] }
   */
  const subpropsGroupedByPrefix = new Map()

  /* In the above example:
   * { 'foo' => Prop.someType().path('foo') }
   * with a synthetic 'bar' key/value added in the second loop.
   */
  const topLevelProperties = new Map()

  for (const p of props) {
    const prefix = getFirstPathComponent(p._path)

    if (getParentPath(p._path) === '') {
      topLevelProperties.set(p._path, p)
      continue
    }

    if (!subpropsGroupedByPrefix.has(prefix))
      subpropsGroupedByPrefix.set(prefix, [])

    subpropsGroupedByPrefix.get(prefix).push(p)
  }

  for (const [prefix, subprops] of subpropsGroupedByPrefix) {
    let topLevelProp = topLevelProperties.get(prefix)

    if (!topLevelProp) {
      topLevelProp = new ObjectProp().path(prefix).required(false)
      topLevelProperties.set(prefix, topLevelProp)
    }

    // *Note*: Calling .props() here may be recursive!
    topLevelProp.props(subprops.map((p) => {
      p._path = getUnprefixedPath(p._path)
      return p
    }))

    if (subprops.some((p) => { return p._required })) {
      topLevelProp.required(true)
    }
  }

  return [...topLevelProperties.values()]
}

function getFirstPathComponent(path) {
  return path.split('.')[0]
}

function getParentPath(path) {
  const splits = path.split('.')
  splits.pop()
  return splits.join('.')
}

function getUnprefixedPath(path) {
  const splits = path.split('.')
  splits.shift()
  return splits.join('.')
}
