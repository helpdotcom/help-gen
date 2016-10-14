'use strict'

const test = require('tap').test
const common = require('../common')
const Prop = require('@helpdotcom/nano-prop')

const fn = common.compile({
  name: 'list_visitors_response'
, type: 'response'
, props: [
    Prop
      .array()
      .path('visitor.pageviews')
      .props([
        Prop.uuid().path('visitor_id')
      , Prop.date().path('created_at')
      , Prop.string().path('device')
      , Prop.string().path('url').optional()
      ])
      .optional()
  ]
})

test('Prop.array().props([])', (t) => {
  t.test('empty object passes', (tt) => {
    const valid = fn({}, (err) => {
      tt.error(err)
      tt.equal(valid, true, 'returns true')
      tt.end()
    })
  })

  t.test('empty array passes', (tt) => {
    const valid = fn({
      visitor: {
        pageviews: []
      }
    }, (err) => {
      tt.error(err)
      tt.equal(valid, true, 'returns true')
      tt.end()
    })
  })

  t.test('missing created_at fails', (tt) => {
    const valid = fn({
      visitor: {
        pageviews: [{}]
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err, /invalid param: "visitor.pageviews[i].created_at"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('missing device fails', (tt) => {
    const valid = fn({
      visitor: {
        pageviews: [{
          created_at: new Date().toISOString()
        }]
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err, /invalid param: "visitor.pageviews[i].device"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('invalid url fails', (tt) => {
    const valid = fn({
      visitor: {
        pageviews: [{
          created_at: new Date().toISOString()
        , device: 'Browser'
        , url: {}
        }]
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err, /invalid param: "visitor.pageviews[i].url"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('missing visitor_id fails', (tt) => {
    const valid = fn({
      visitor: {
        pageviews: [{
          created_at: new Date().toISOString()
        , device: 'Browser'
        }]
      }
    }, (err) => {
      tt.type(err, Error)
      tt.match(err, /invalid param: "visitor.pageviews[i].visitor_id"/)
      tt.equal(valid, false, 'returns false')
      tt.end()
    })
  })

  t.test('everything valid passes', (tt) => {
    const valid = fn({
      visitor: {
        pageviews: [{
          created_at: new Date().toISOString()
        , device: 'Browser'
        , visitor_id: '0733A9C4-1963-492A-B656-26AD0AD8E258'
        }]
      }
    }, (err) => {
      tt.error(err)
      tt.equal(valid, true, 'returns true')
      tt.end()
    })
  })

  t.end()
})
