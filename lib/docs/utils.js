'use strict'

exports.md = {
  link: function(href, title) {
    return `[${title}](${href})`
  }
, li: function(str) {
    return `- ${str}`
  }
}

// buf must be a cheerio instance returned from marky-markdown
exports.wrapNotes = function wrapNotes(buf) {
  const notes = buf('p strong')
  const alert = buf('<div class="alert"></div>')
  notes.each(function(idx, ele) {
    buf(ele).parent().wrap(alert)
  })
  return buf
}
