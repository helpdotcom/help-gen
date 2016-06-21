'use strict'

const test = require('tap').test
const build = require('../../lib/docs/build-example')

test('buildExample', (t) => {
  let input = [
    { path: 'name'
    , example: 'Evan'
    , type: 'string'
    }
  ]

  t.deepEqual(build(input), { name: 'Evan' })

  input = [
    { path: 'id'
    , type: 'uuid'
    }
  , { path: 'id2'
    , type: 'uuid'
    , example: 'FC70C249-888F-412B-BE8B-80B16BB8F35A'
    }
  , { path: 's'
    , type: 'string'
    }
  , { path: 'n'
    , type: 'number'
    }
  , { path: 'n2'
    , type: 'number'
    , example: 0
    }
  , { path: 'b'
    , type: 'boolean'
    }
  , { path: 'status'
    , type: 'enum'
    , values: ['available', 'invisible', 'away']
    }
  , { path: 'a.a'
    , type: 'array'
    }
  , { path: 'o'
    , type: 'object'
    }
  , { path: 'accepts_offline_messages'
    , type: 'boolean'
    , example: true
    }
  , { path: 'd'
    , type: 'date'
    }
  , { path: 'departments'
    , type: 'array'
    , example: [
        { id: 'DCD12C37-1731-4232-B7DA-48192B736BCF'
        , name: 'Department 1'
        , members: [
            { id: '6B7C55A3-B605-4752-AE77-89E1A363B03C'
            , chatSlots: 3
            }
          ]
        }
      ]
    }
  ]

  const res = build(input)

  t.type(res.id, 'string')
  t.equal(res.id2, 'FC70C249-888F-412B-BE8B-80B16BB8F35A', 'id2')
  t.equal(res.s, '<string>', 's')
  t.equal(res.n, 1, 'n')
  t.equal(res.n2, 0, 'n2')
  t.equal(res.b, false, 'b')
  t.type(res.a, 'object')
  t.deepEqual(res.a.a, [], 'a')
  t.deepEqual(res.o, {}, 'o')
  t.equal(res.status, 'available', 'status')
  t.equal(res.accepts_offline_messages, true, 'accepts_offline_messages')
  t.match(res.d, /[\d]{4}-[\d]{2}-[\d]{2}T[\d]{2}:[\d]{2}:[\d]{2}\.[\d]{3}Z/)
  t.deepEqual(res.departments, [
    { id: 'DCD12C37-1731-4232-B7DA-48192B736BCF'
    , name: 'Department 1'
    , members: [
        { id: '6B7C55A3-B605-4752-AE77-89E1A363B03C'
        , chatSlots: 3
        }
      ]
    }
  ])

  const widgetProps = require('../fixtures/widget').properties
  const o = build(widgetProps)
  t.deepEqual(o, {
    colors: {
      fields: {
        activeColor: '#0A5B8F'
      , inactiveColor: '#CDDEE8'
      , activeBorder: '#0A5B8F'
      , inactiveBorder: '#CDDEE8'
      , errorBorder: '#E8CECC'
      , inactiveLabel: '#9A9A9A'
      , activeLabel: '#286F9D'
      , errorLabel: '#DC2733'
      }
    , buttons: {
        background: '#6699ff'
      , font: '#DCEDF9'
      , hoverBackground: '#cc66ff'
      , hoverFont: '#F4E6F5'
      , disabledBackground: '#cccccc'
      , disabledFont: '#000'
      }
    }
  , widget: {
      position: 'bottom-left'
    , height: 420
    , visibility: 'minimized'
    , colors: {
        headerBackground: '#00578F'
      , headerFont: '#fff'
      , bodyBackground: '#fff'
      , bodyFont: '#666'
      , bodyBorder: '2px solid #f6f6f6'
      , footerBackground: '#F0F5F9'
      , footerFont: '#000'
      , sectionColors: {
          leftBackground: '#F2F2F2'
        , middleBackground: '#F2F2F2'
        , rightBackground: '#F2F2F2'
        }
      , header: {
          buttons: {
            background: '#F2F2F2'
          , icon: '#F2F2F2'
          , hoverBackground: '#F2F2F2'
          , hoverIcon: '#F2F2F2'
          }
        }
      , hamburger: {
          background: '#F2F2F2'
        , hoverBackground: '#F2F2F2'
        , border: '#F2F2F2'
        , hoverBorder: '#F2F2F2'
        , icon: '#F2F2F2'
        , hoverIcon: '#F2F2F2'
        }
      , floatingMenu: {
          bottomBorder: '#F2F2F2'
        , background: '#F2F2F2'
        , hoverBackground: '#F2F2F2'
        , volume: {
            background: '#F2F2F2'
          , hoverBackground: '#F2F2F2'
          }
        }
      }
    , minimizedHeaderText: {
        offline: 'offline message'
      , online: 'online message'
      }
    , prechatSurvey: {
        instructions: 'instructions'
      }
    , offlineSurvey: {
        heading: 'instructions'
      , instructions: 'instructions'
      }
    }
  })

  t.end()
})
