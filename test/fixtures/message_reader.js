/* eslint-disable */

'use strict'

const Reader = require('@helpdotcom/buffer-utils').Reader

module.exports = UIMessage

const ENUM_MESSAGETYPE = ['general']

const ENUM_METHOD = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS'
]

function UIMessage(buf) {
  const reader = new Reader(buf)
  this.totalLength = buffer.int(8)
  reader.skip(1)
  this.messageType = ENUM_MESSAGETYPE[buffer.char(2)]
  reader.skip(1)
  this.messageFormatVersion = buffer.char(4)
  reader.skip(1)
  this.id = buffer.uuid()
  reader.skip(1)
  this.replyToId = buffer.uuid()
  reader.skip(1)
  this.statusCode = buffer.int(3)
  reader.skip(1)
  this.method = ENUM_METHOD[buffer.char(1)]
  reader.skip(1)
  this.uri = buffer.varchar(3)
  reader.skip(1)
  this.body = buffer.varchar(8)
  reader.skip(1)
}


/* eslint-enable */
