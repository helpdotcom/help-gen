'use strict'

const test = require('tap').test
const Definition = require('../../lib/model/definition')

test('Definition Filenames', (t) => {
  t.test('simple type name', (tt) => {
    const def = new Definition({
      name: 'Simple'
    , type: 'simple'
    , props: []
    })
    tt.equal(def.filename, 'simple.js', 'filename')
    tt.end()
  })

  t.test('simple with under scores', (tt) => {
    const def = new Definition({
      name: 'Underscores'
    , type: 'type_with_underscores'
    , props: []
    })

    tt.equal(def.filename, 'type_with_underscores.js', 'filename')
    tt.end()
  })

  t.test('simple with spaces', (tt) => {
    const def = new Definition({
      name: 'Spaces'
    , type: ' i have spaces '
    , props: []
    })

    tt.equal(def.filename, 'i_have_spaces.js', 'filename')
    tt.end()
  })

  t.test('Spaces with symbols', (tt) => {
    const def = new Definition({
      name: 'Symbols'
    , type: ' k!tten$'
    , props: []
    })

    tt.equal(def.filename, 'k_tten_.js', 'filename')

    const colons = new Definition({
      name: 'Colons'
    , type: 'foo:bar:baz   '
    , props: []
    })

    tt.equal(colons.filename, 'foo_bar_baz.js', 'filename')
    tt.end()
  })

  t.test('complex name', (tt) => {
    const def = new Definition({
      name: 'Complex'
    , type: '  i @m a (*mpl3x. and $hould\'t be tru$ted  '
    , props: []
    })
    const expected = 'i__m_a___mpl3x__and__hould_t_be_tru_ted.js'
    tt.equal(def.filename, expected, 'filename')
    tt.end()
  })
  t.end()
})
