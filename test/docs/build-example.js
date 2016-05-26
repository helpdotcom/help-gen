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
  t.end()
})
