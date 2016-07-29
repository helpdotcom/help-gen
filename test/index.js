'use strict'

const test = require('tap').test
const v8 = require('v8')
v8.setFlagsFromString('--no_warn_template_set')

test('help-gen', (t) => {
  const Gen = require('../')

  t.type(Gen.Validator, 'function')

  // check that docs is not in require.cache
  const fp = require.resolve('../lib/docs')
  t.notOk(require.cache[fp], 'docs are not loaded yet')
  t.type(Gen.docs, 'function')
  t.ok(require.cache[fp], 'docs are now loaded')
  t.end()
})
