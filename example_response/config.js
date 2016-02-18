'use strict'

module.exports = Organization

function Organization(opts) {
  opts = opts || {}
  this.id = opts.id
  this.createdAt = opts.createdAt
  this.modifiedAt = opts.modifiedAt
}

Organization.fromRow = function fromRow(opts) {
  return new Organization(opts)
}

Organization.prototype.isValid = function isValid() {
  const out = {
    valid: true,
    msg: ''
  }
  if (!isv4UUID(this.id)) {
    out.valid = false
    out.msg = 'property "id" is invalid. Expected type "uuid"'
    return out
  }
  if (!isDate(this.createdAt)) {
    out.valid = false
    out.msg = 'property "createdAt" is invalid. Expected type "date"'
    return out
  }
  if (!isDate(this.modifiedAt)) {
    out.valid = false
    out.msg = 'property "modifiedAt" is invalid. Expected type "date"'
    return out
  }
  return out
}

function isDate(d) {
  let date = new Date(d)
  let a = date.getDate()
  return a === a
}

function isv4UUID(s) {
  return isUUID(s) === 4
}

function isUUID(s) {
  var i = 0
  var len = s.length
  if (len !== 36) {
    i = 1
  }
  var stop = i + 8
  var c, v
  for (;;) {
    do {
      c = s.charCodeAt(i)
      if (c < 48)
        return 0
      if (c > 57 && ((c |= 32) < 97 || c > 102))
        return 0
    } while (++i !== stop)
    if (i === len)
      break
    c = s.charCodeAt(i)
    if (c !== 45)
      return 0
    stop = ++i + 12
    if (stop !== len)
      stop -= 8
  }
  v = s.charCodeAt(len - 22) - 48
  if (v === 1 || v === 2)
    return v
  if (v === 3 || v === 4 || v === 5) {
    c = s.charCodeAt(len - 17)
    if (c === 56 || c === 57)
      return v
    c |= 32
    if (c === 97 || c === 98)
      return v
  }
  return -1
}
