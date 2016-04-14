'use strict'

const Section = require('./section')

// This file is responsible for taking a _Section_ object and converting
// it to the markdown representation of it.

module.exports = Markdown

function Markdown(section) {
  if (!(section instanceof Section)) {
    throw new TypeError('section must be a Section')
  }

  this.section = section
  this.json = section.toJSON()
  this.buf = []
}

Markdown.prototype.toString = function toString() {
  const opts = this.json
  this._line(`### ${opts.title}`)
  this._line()
  this._line(opts.description)
  this._line()
  this._line(`    ${opts.method} ${opts.url}`)
  this._line()

  if (opts.params && opts.params.length) {
    this._writeParams('Parameters', opts.params)
  }

  if (opts.request && opts.request.length) {
    this._writeParams('Input', opts.request)
  }

  if (opts.requestNote) {
    this._line(this._toNote(opts.requestNote))
    this._line()
  }

  if (opts.response && opts.response.length) {
    this._line('#### Response')
    this._line()
    this._line(this._toCode('Status: 200 OK', 'headers'))
  }

  if (opts.exampleResponse) {
    const ex = JSON.stringify(opts.exampleResponse, null, 2)
    this._line(this._toCode(ex, 'json'))
    this._line()
  }

  if (opts.responseNote) {
    this._line(this._toNote(opts.responseNote))
    this._line()
  }

  this._line('***\n\n')
  const out = this.buf.join('\n')

  return out
}

Markdown.prototype._writeParams = function _writeParams(title, params) {
  this._line(`#### ${title}\n`)
  this._tableHead('Name', 'Type', 'Description')
  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    this._writeParam(param)
  }
  this._line()
}

Markdown.prototype._writeParam = function _writeParam(param) {
  const name = this._toCodeString(param.name)
  const type = this._toCodeString(param.type === 'uuid'
    ? 'uuid (v4)'
    : param.type)

  const desc = param.required
    ? `**Required** ${param.description || ''}`
    : (param.description || '')

  this._tableRow(name, type, desc)
}

Markdown.prototype._toCodeString = function _toCodeString(str) {
  return `\`${str}\``
}

Markdown.prototype._toCode = function _toCode(str, lang) {
  lang = lang || ''
  return `\`\`\`${lang}\n${str}\n\`\`\`\n`
}

Markdown.prototype._toNote = function _toNote(str) {
  return `**Note:** ${str}`
}

Markdown.prototype._line = function _line(l) {
  l = l || ''
  this.buf.push(l)
}

Markdown.prototype._tableRow = function _tableRow() {
  const args = new Array(arguments.length)
  for (let i = 0; i < arguments.length; i++) {
    args[i] = arguments[i]
  }
  this._line(`| ${args.join(' | ')} |`)
}

Markdown.prototype._tableHead = function _tableHead() {
  const args = new Array(arguments.length)
  for (let i = 0; i < arguments.length; i++) {
    args[i] = arguments[i]
  }
  this._tableRow.apply(this, args)
  let buf = []
  for (let i = 0; i < args.length; i++) {
    buf.push(`| ${'-'.repeat(args[i].length)} `)
  }
  this.buf.push(`${buf.join('')}|`)
}
