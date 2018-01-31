'use strict'

const TYPES = require('./types')

const NEED_HELP_IS = TYPES.NEED_HELP_IS

function mergeDeps(a, b) {
  a.is = a.is || b.is
  a.has = a.has || b.has
  a.index = a.index || b.index
  return a
}

function extractDependenciesFromSingleProp(prop) {
  const deps = {
    is: NEED_HELP_IS.has(prop.type)
  , has: !prop.required
  , index: prop.type === 'ref'
  }

  if (prop.type === 'object' && Array.isArray(prop.props)) {
    for (const child of prop.props) {
      mergeDeps(deps, extractDependenciesFromSingleProp(child))
    }
  }

  if (prop.type === 'array' && prop.props) {
    mergeDeps(deps, extractDependenciesFromSingleProp(prop.props))
  }

  return deps
}

function extractDependencies(prop, ...props) {
  if (prop === undefined) return {}

  const deps = extractDependenciesFromSingleProp(prop.toJSON())

  return mergeDeps(deps, extractDependencies(...props))
}

module.exports = extractDependencies
