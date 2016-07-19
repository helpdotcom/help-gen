'use strict'

//
// A section represents the documentation for a single route.
//

//
// { method: 'GET'
// , path: '/organization'
// , input: require('./validators/thing').properties
// , inputNote: 'Dont try this at home kids'
// , output: require('./responses/thing').properties
// , outputNote: 'This thing is weird'
// , description: 'The description'
// , title: 'The title'
// , params: []
// }


/*

We want it to end up something like:

## ${TITLE}

${DESCRIPTION}

    ${METHOD} ${URL}

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Input

| Name | Type | Description |
| ---- | ---- | ----------- |

${INPUT_NOTE}

#### Response

```json
{

}
```

${OUTPUT_NOTE}

***

*/

const buildExample = require('./build-example')
const formatProp = require('../property')

module.exports = Section

const Markdown = require('./markdown')

function Section(opts, doc) {
  assertProp(opts, 'method')
  assertProp(opts, 'title')
  assertProp(opts, 'path')

  this.opts = opts
  this.opts.originalPath = opts.path
  // convert a url like /organization/:id(regex) to /organization/:id
  this.opts.path = opts.path.replace(/\/:([^\(]+)\(([^\)]+)\)/g, '/:$1')
  this.opts.port = doc.config.has('port')
    ? doc.config.get('port').default
    : null

  this.multiResponse = false
  this.output = this.opts.output
  opts.method = opts.method.toUpperCase()

  if (Array.isArray(opts.output) && opts.output.length === 1) {
    if (Array.isArray(opts.output[0])) {
      this.multiResponse = true
      this.output = opts.output[0]
    }
  }

  // If this is a GET or a DELETE request,
  // then the params will be replaced by input.
  // IOW, the input will be validated as query string params.
  if (opts.method === 'GET' || opts.method === 'DELETE') {
    if (opts.input && !opts.params) {
      opts.params = opts.input
      opts.input = null
    }
  }
  this.buf = []
}

function assertProp(obj, prop) {
  if (!obj.hasOwnProperty(prop)) {
    throw new Error(`opts.${prop} is required`)
  }
}

Section.prototype.toJSON = function toJSON() {
  const opts = this.opts
  const out = {
    title: opts.title
  , description: opts.description || null
  , method: opts.method
  , url: opts.path
  , params: opts.params ? opts.params.map(formatProp) : opts.params
  , request: opts.input ? opts.input.map(formatProp) : opts.input
  , curl: opts.port ? this._curl() : null
  , response: this._formatJsonResponse()
  , requestNote: opts.inputNote
  , responseNote: opts.outputNote
  , exampleResponse: this.output ? this.response(this.output) : null
  }

  if (opts.originalPath) {
    out.originalUrl = opts.originalPath
  }

  return out
}

Section.prototype._curl = function _curl() {
  const buf = ['curl'
                , '-s'
                , '-H'
                , '\'Content-type: application/json\''
                , '-H'
                , '\'Accept: application/json\''
                , `http://localhost:${this.opts.port}${this.opts.path}`
              ]

  if (this.opts.method !== 'GET') {
    buf.push(`-X ${this.opts.method}`)
  }

  if (this.opts.method !== 'GET' &&
      this.opts.method !== 'DELETE' &&
      this.opts.input
    ) {
    const res = buildExample(this.opts.input)
    buf.push(`-d \'${JSON.stringify(res)}\'`)
  }

  return buf.join(' ')
}

Section.prototype._formatJsonResponse = function _formatJsonResponse() {
  const output = this.output
  const r = output
    ? output.map(formatProp)
    : output

  if (r) {
    if (this.multiResponse) return [r]
    return r
  }

  return r
}

Section.prototype.response = function response(output) {
  const res = buildExample(output)
  if (!this.multiResponse) return res
  return [res]
}

Section.prototype._toMarkdown = function _toMarkdown() {
  return new Markdown(this)
}

Section.prototype.toMarkdown = function toMarkdown() {
  return this._toMarkdown().toString()
}
