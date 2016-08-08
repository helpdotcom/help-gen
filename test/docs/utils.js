'use strict'

const test = require('tap').test
const utils = require('../../lib/docs/utils')

test('md', (t) => {
  test('link', (t) => {
    t.equal(utils.md.link('#a', 'A'), '[A](#a)', 'md link works')
    t.end()
  })

  test('li', (t) => {
    t.equal(utils.md.li('a'), '- a', 'md li works')
    t.end()
  })

  t.end()
})
