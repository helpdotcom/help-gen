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

UIMessage.DELIMITER = ''
UIMessage.VERSION = '1.0'

function UIMessage(buf) {
  const reader = new Reader(buf)
  this.totalLength = buffer.int(8)
  this.messageType = ENUM_MESSAGETYPE[buffer.char(2)]
  this.messageFormatVersion = buffer.char(4)
  this.id = buffer.uuid()
  this.replyToId = buffer.uuid()
  this.statusCode = buffer.int(3)
  this.method = ENUM_METHOD[buffer.char(1)]
  this.uri = buffer.varchar(3)
  this.body = buffer.varchar(8)
}


/* eslint-enable */
