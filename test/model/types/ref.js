'use strict'

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const test = require('tap').test
const {Prop} = require('../../../')
const Manager = require('../../../').ModelManager
const TMP = path.join(__dirname, 'fixtures')

function getTmpDir(dir) {
  if (dir[dir.length - 1] !== path.sep) {
    return dir + path.sep
  }

  return dir
}

class TestCase {
  constructor(configs) {
    this.configs = configs
    this.dir = fs.mkdtempSync(getTmpDir(TMP))
    this.manager = new Manager({
      configs: configs
    })
    this.modelsDir = path.join(this.dir, 'models')
    this.models = {}
    this.setup()
  }

  setup() {
    mkdirp.sync(this.modelsDir)
    const generated = this.manager.generate()
    for (const item of generated.values()) {
      const fp = path.join(this.modelsDir, item.filename)
      fs.writeFileSync(fp, item.code, 'utf8')
    }

    for (const [name, item] of generated) {
      const fp = path.join(this.modelsDir, item.filename)
      this.models[name] = require(fp)
    }
  }
}

test('setup', (t) => {
  // create the tmp directories for each test case
  mkdirp.sync(TMP)
  t.end()
})

const DATE = new Date().toISOString()
const UUID = '7207606C-9FE8-437D-AD5F-3EDA142AFF1F'

test('Prop.ref()', (t) => {
  const state = new TestCase([
    { name: 'Visitor'
    , type: 'visitor'
    , props: [
        Prop.uuid().path('id')
      , Prop.string().path('name')
      ]
    }
  , { name: 'VisitorJoin'
    , type: 'visitor_join'
    , includeType: true
    , props: [
        Prop.date().path('created_at')
      , Prop.ref('Visitor').path('visitor')
      ]
    }
  ])

  const CREATED_AT_ERROR = /invalid property: "created_at". Expected date/
  const ARRAY_ERROR = /invalid property: "opts". Expected object/
  const VISITOR_ID_ERROR = /invalid property: "id". Expected uuid/
  const VISITOR_NAME_ERROR = /invalid property: "name". Expected string/

  const MODELS = state.models.Index
  const Visitor = MODELS.Visitor
  const VisitorJoin = MODELS.VisitorJoin

  t.test('VisitorJoin', (tt) => {
    tt.throws(() => {
      new VisitorJoin({})._validate()
    }, CREATED_AT_ERROR, 'throws when missing created_at')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      })
    }, ARRAY_ERROR, 'throws when missing visitor')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      , visitor: {}
      })
    }, VISITOR_ID_ERROR, 'throws when missing visitor.id')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      , visitor: {
          id: UUID
        }
      })
    }, VISITOR_NAME_ERROR, 'throws when missing visitor.name')

    const model = new VisitorJoin({
      created_at: DATE
    , visitor: {
        id: UUID
      , name: 'Evan'
      }
    })

    const json = JSON.parse(JSON.stringify(model.toJSON()))

    tt.deepEqual(json, {
      created_at: DATE
    , type: 'visitor_join'
    , visitor: {
        id: UUID
      , name: 'Evan'
      }
    }, 'toJSON() includes type for VisitorJoin')

    tt.type(model.visitor, Visitor)
    tt.doesNotThrow(() => {
      model._validate()
    }, 'model._validate() does not throw')

    tt.throws(() => {
      model.visitor = null
      model._validate()
    }, ARRAY_ERROR, '_validate() throws when visitor is null')

    model.visitor = {
      id: UUID
    , name: 'Evan'
    }

    tt.doesNotThrow(() => {
      model._validate()
    }, 'model._validate() with valid, POJO for visitor')

    tt.end()
  })

  t.test('Visitor', (tt) => {
    tt.throws(() => {
      new Visitor()
    }, ARRAY_ERROR, 'throws when missing opts')

    tt.throws(() => {
      new Visitor({ id: UUID })
    }, VISITOR_NAME_ERROR, 'throws when missing visitor.name')


    tt.end()
  })

  t.end()
})

test('Prop.ref().multi()', (t) => {
  const state = new TestCase([
    { name: 'Visitor'
    , type: 'visitor'
    , props: [
        Prop.uuid().path('id')
      , Prop.string().path('name')
      ]
    }
  , { name: 'VisitorJoin'
    , type: 'visitor_join'
    , props: [
        Prop.date().path('created_at')
      , Prop.ref('Visitor').path('visitors').multi()
      ]
    }
  ])

  const CREATED_AT_ERROR = /invalid property: "created_at". Expected date/
  const VISITOR_ERROR = /invalid property: "opts". Expected object/
  const VISITOR_ID_ERROR = /invalid property: "id". Expected uuid/
  const VISITOR_NAME_ERROR = /invalid property: "name". Expected string/
  const ARRAY_ERROR = /invalid property: "visitors". Expected array/

  const MODELS = state.models.Index
  const Visitor = MODELS.Visitor
  const VisitorJoin = MODELS.VisitorJoin

  t.test('VisitorJoin', (tt) => {
    tt.throws(() => {
      new VisitorJoin({})._validate()
    }, CREATED_AT_ERROR, 'throws when missing created_at')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      })
    }, ARRAY_ERROR, 'throws when missing visitor')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      , visitors: [{}]
      })
    }, VISITOR_ID_ERROR, 'throws when missing visitor.id')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      , visitors: [{
          id: UUID
        }]
      })
    }, VISITOR_NAME_ERROR, 'throws when missing visitor.name')

    const model = new VisitorJoin({
      created_at: DATE
    , visitors: [{
        id: UUID
      , name: 'Evan'
      }]
    })

    tt.type(model.visitors, Array)
    for (const v of model.visitors) {
      tt.type(v, Visitor)
    }

    tt.doesNotThrow(() => {
      model._validate()
    }, 'model._validate() does not throw')

    tt.throws(() => {
      model.visitors = null
      model._validate()
    }, ARRAY_ERROR, '_validate() throws when visitor is null')

    model.visitors = [{
      id: UUID
    , name: 'Evan'
    }]

    tt.doesNotThrow(() => {
      model._validate()
    }, 'model._validate() with valid, POJO for visitor')

    tt.end()
  })

  t.test('Visitor', (tt) => {
    tt.throws(() => {
      new Visitor()
    }, VISITOR_ERROR, 'throws when missing opts')

    tt.throws(() => {
      new Visitor({ id: UUID })
    }, VISITOR_NAME_ERROR, 'throws when missing visitor.name')


    tt.end()
  })

  t.end()
})

test('Prop.ref().optional()', (t) => {
  const state = new TestCase([
    { name: 'Visitor'
    , type: 'visitor'
    , props: [
        Prop.uuid().path('id')
      , Prop.string().path('name')
      ]
    }
  , { name: 'VisitorJoin'
    , type: 'visitor_join'
    , props: [
        Prop.date().path('created_at')
      , Prop.ref('Visitor').path('visitor').optional()
      ]
    }
  ])

  const CREATED_AT_ERROR = /invalid property: "created_at". Expected date/
  const ARRAY_ERROR = /invalid property: "opts". Expected object/
  const VISITOR_ID_ERROR = /invalid property: "id". Expected uuid/
  const VISITOR_NAME_ERROR = /invalid property: "name". Expected string/

  const MODELS = state.models.Index
  const Visitor = MODELS.Visitor
  const VisitorJoin = MODELS.VisitorJoin

  t.test('VisitorJoin', (tt) => {
    tt.throws(() => {
      new VisitorJoin({})._validate()
    }, CREATED_AT_ERROR, 'throws when missing created_at')

    tt.doesNotThrow(() => {
      new VisitorJoin({
        created_at: DATE
      })._validate()
    }, 'does not throw when visitor is optional and missing')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      , visitor: {}
      })
    }, VISITOR_ID_ERROR, 'throws when missing visitor.id')

    tt.throws(() => {
      new VisitorJoin({
        created_at: DATE
      , visitor: {
          id: UUID
        }
      })
    }, VISITOR_NAME_ERROR, 'throws when missing visitor.name')

    const model = new VisitorJoin({
      created_at: DATE
    , visitor: {
        id: UUID
      , name: 'Evan'
      }
    })

    tt.type(model.visitor, Visitor)
    tt.doesNotThrow(() => {
      model._validate()
    }, 'model._validate() does not throw')

    tt.throws(() => {
      model.visitor = null
      model._validate()
    }, ARRAY_ERROR, '_validate() throws when visitor is null')

    model.visitor = {
      id: UUID
    , name: 'Evan'
    }

    tt.doesNotThrow(() => {
      model._validate()
    }, 'model._validate() with valid, POJO for visitor')

    tt.end()
  })

  t.test('Visitor', (tt) => {
    tt.throws(() => {
      new Visitor()
    }, ARRAY_ERROR, 'throws when missing opts')

    tt.throws(() => {
      new Visitor({ id: UUID })
    }, VISITOR_NAME_ERROR, 'throws when missing visitor.name')


    tt.end()
  })

  t.end()
})

test('cleanup', (t) => {
  rimraf.sync(TMP)
  t.end()
})
