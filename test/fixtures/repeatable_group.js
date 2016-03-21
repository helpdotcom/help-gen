/* eslint-disable */

'use strict'

const Reader = require('@helpdotcom/buffer-utils').Reader

module.exports = UIEvent

const ENUM_MESSAGETYPE = ['general']

function UIEvent(buf) {
  const reader = new Reader(buf)
  this.totalLength = buffer.int(8)
  reader.skip(1)
  this.messageType = ENUM_MESSAGETYPE[buffer.char(2)]
  reader.skip(1)
  this.messageFormatVersion = buffer.char(4)
  reader.skip(1)
  this.messages = new Array(buffer.int(3))
  for (var i = 0; i < this.messages.length; i++) {
    this.messages[i] = reader.varchar(8)
  }
}


/* eslint-enable */
