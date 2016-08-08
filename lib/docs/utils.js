'use strict'

exports.md = {
  link: function(href, title) {
    return `[${title}](${href})`
  }
, li: function(str) {
    return `- ${str}`
  }
}
