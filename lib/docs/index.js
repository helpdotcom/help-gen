'use strict'

const fs = require('fs')
const path = require('path')
const marky = require('marky-markdown')
const Slugger = require('github-slugger')
const Section = require('./section')
const utils = require('./utils')
const configDefaults = require('@helpdotcom/config/lib/defaults')
const builtinRoutes = require('@helpdotcom/http').builtins

const defaultTemplatePath = path.join(__dirname, 'template.html')
const defaultTemplate = fs.readFileSync(defaultTemplatePath, 'utf8')

module.exports = Docs

function Docs(routes, opts) {
  if (!(this instanceof Docs))
    return new Docs(routes, opts)
    
  if (!Array.isArray(routes)) {
    throw new TypeError('routes must be an Array')
  }
  
  const allRoutes = routes.concat(builtinRoutes)

  opts = Object.assign({
    toc: true
  , template: defaultTemplate
  , curl: true
  }, opts)

  if (!opts.title) {
    throw new Error('opts.title is required')
  }

  this.routes = allRoutes
  this.opts = opts
  this.template = opts.template
  this.title = opts.title
  this.slugger = new Slugger()
  this.config = this._mergeConfig(opts.config)
}

Docs.prototype._mergeConfig = function _mergeConfig(config) {
  config = config || []
  const items = new Map()
  for (const item of config) {
    const name = item.name
    items.set(name, Object.assign({}, item))
  }

  for (const item of configDefaults) {
    if (!items.has(item.name)) {
      const thing = Object.assign({}, item)
      thing.isDefault = true
      items.set(item.name, thing)
    }
  }

  return items
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

Docs.prototype.configToMarkdown = function configToMarkdown() {
  let buf = '## Service Environment Configuration\n\n'
  const config = this.config

  buf += '| Name | Type | Required | Default | Environment Variable |\n'
  buf += '| ---- | ---- | -------- | ------- | -------------------- |\n'

  for (const item of config.values()) {
    buf += configItemToMarkdown(item)
  }

  buf += '\n'
  return buf
}

function configItemToMarkdown(item) {
  const req = item.required ? 'yes' : 'no'
  const n = `\`${item.name}\``
  const def = item.default
    ? `\`${item.default}\``
    : '(none)'
  const env = `\`${item.env}\``
  return `| ${n} | ${item.type} | ${req} | ${def} | ${env} |\n`
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

  buf += this.configToMarkdown()

  if (routes.length) {
    buf += '## API\n\n'
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
  , config: Array.from(this.config.values())
  }, null, 2)
}
