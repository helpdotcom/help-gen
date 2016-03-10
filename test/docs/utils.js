'use strict'

const test = require('tap').test
const utils = require('../../lib/docs/utils')
const marky = require('marky-markdown')

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

test('wrapNotes', (t) => {
  const md = '# Heading1\n\n**Note:** This is a test\n'
  const buf = utils.wrapNotes(marky(md)).html()
  t.equal(buf, '<h1 id="user-content-heading1" class="deep-link"><a href="' +
    '#heading1">Heading1</a></h1>\n<div class="alert"><p><strong>Note:' +
    '</strong> This is a test</p></div>\n')
  t.end()
})
