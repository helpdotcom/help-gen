'use strict'

const fs = require('fs')
const path = require('path')
const marky = require('marky-markdown')
const Slugger = require('github-slugger')
const Section = require('./section')
const utils = require('./utils')

const defaultTemplatePath = path.join(__dirname, 'template.html')
const defaultTemplate = fs.readFileSync(defaultTemplatePath, 'utf8')

module.exports = Docs

function Docs(routes, opts) {
  if (!(this instanceof Docs))
    return new Docs(routes, opts)

  if (!Array.isArray(routes)) {
    throw new TypeError('routes must be an Array')
  }

  opts = Object.assign({
    toc: true
  , template: defaultTemplate
  , curl: true
  }, opts)

  if (!opts.title) {
    throw new Error('opts.title is required')
  }

  this.routes = routes
  this.opts = opts
  this.template = opts.template
  this.title = opts.title
  this.slugger = new Slugger()
}

Docs.prototype._buildTOC = function _buildTOC() {
  this.slugger.reset()
  return this.routes.map((route) => {
    return {
      title: route.title
    , slug: this.slugger.slug(route.title)
    }
  })
}

Docs.prototype.render = function render(format) {
  switch (format) {
    case 'markdown':
      return this.toMarkdown()
    case 'html':
      return this.toHTML()
    case 'json':
      return this.toJSON()
  }

  throw new Error(`Invalid format: ${format}`)
}

Docs.prototype.toMarkdown = function toMarkdown() {
  const routes = this.routes
  const opts = this.opts
  let buf = ''

  const li = utils.md.li
  const link = utils.md.link

  if (opts.title) {
    buf += `# ${opts.title}\n\n`
  }

  if (opts.toc) {
    const toc = this._buildTOC()
    for (let i = 0; i < toc.length; i++) {
      buf += li(link(`#${toc[i].slug}`, toc[i].title)) + '\n'
    }

    buf += '\n\n'
  }

  for (let i = 0; i < routes.length; i++) {
    const obj = Object.assign({}, {
      curl: opts.curl
    }, routes[i])
    const section = new Section(obj)
    buf += section.toMarkdown()
  }

  return buf
}

Docs.prototype.toHTML = function toHTML() {
  const tpl = this.template
  const md = this.toMarkdown()
  const html = marky(md, {
    prefixHeadingIds: false
  })
  const out = tpl.replace('___CONTENT___', utils.wrapNotes(html).html())
  return out
}

Docs.prototype.toJSON = function toJSON() {
  return JSON.stringify({
    title: this.title
  , routes: this.routes.map((route) => {
      return new Section(route).toJSON()
    })
  }, null, 2)
}
