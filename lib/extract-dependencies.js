'use strict'

const TYPES = require('./types')

const NEED_HELP_IS = TYPES.NEED_HELP_IS

function mergeDeps(a, b) {
  a.is = a.is || b.is
  a.has = a.has || b.has
  return a
}

function extractDependenciesFromSingleProp(prop) {
  const deps = {
    is: NEED_HELP_IS.has(prop.type)
  , has: !prop.required
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
  const deps = extractDependenciesFromSingleProp(prop.toJSON())
  if (props.length === 0)
    return deps

  return mergeDeps(deps, extractDependencies(...props))
}

module.exports = extractDependencies
