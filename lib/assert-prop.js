'use strict'

const assert = require('assert')
const eq = assert.strictEqual

module.exports = function assertProp(prop) {
  eq(typeof prop.type, 'string', 'Invalid prop. "type" must be a string.')
  eq(typeof prop.path, 'string', 'Invalid prop. "path" must be a string.')
  if (prop.type === 'regex') {
    assert(prop.value, 'Invalid prop. "value" is required for "regex" type.')
  }

  if (prop.type === 'enum') {
    assert(Array.isArray(prop.values), 'Invalid prop. "values" is required ' +
      'for "enum" type.')
    for (const val of prop.values) {
      assert(typeof val === 'string' || typeof val === 'number', 'Invalid ' +
        `prop. Value must be a string or number. Got "${val}"`)
    }
  }
}
