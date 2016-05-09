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

const ast = require('../ast')
const generator = require('../generate')
const buildObj = require('../build-default-obj')
const vm = require('vm')
const formatProp = require('../property')
const genOpts = {
  format: {
    quotes: 'double'
  , json: true
  , compact: true
  }
}

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

  this.multiResponse = false
  this.output = this.opts.output

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
  , method: opts.method.toUpperCase()
  , url: opts.path
  , params: opts.params ? opts.params.map(formatProp) : opts.params
  , request: opts.input ? opts.input.map(formatProp) : opts.input
  , response: opts.output ? opts.output.map(formatProp) : opts.output
  , requestNote: opts.inputNote
  , responseNote: opts.outputNote
  , exampleResponse: this.response(this.output)
  }

  if (opts.originalPath) {
    out.originalUrl = opts.originalPath
  }

  return out
}

Section.prototype.response = function response(output) {
  const a = ast.objectExpression(buildObj(output))
  const code = generator.customGenerate(a, genOpts)
  const sandbox = {}
  vm.runInNewContext(`this.out = ${code}`, sandbox)
  if (!this.multiResponse)
    return sandbox.out

  return JSON.parse(`[${JSON.stringify(sandbox.out)}]`)
}

Section.prototype._toMarkdown = function _toMarkdown() {
  return new Markdown(this)
}

Section.prototype.toMarkdown = function toMarkdown() {
  return this._toMarkdown().toString()
}
