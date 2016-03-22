/* eslint-disable */

'use strict'

const Reader = require('@helpdotcom/buffer-utils').Reader

module.exports = UIEvent

const ENUM_MESSAGETYPE = ['general']

UIEvent.DELIMITER = ''
UIEvent.VERSION = '1.0'

function UIEvent(buf) {
  const reader = new Reader(buf)
  this.totalLength = buffer.int(8)
  this.messageType = ENUM_MESSAGETYPE[buffer.char(2)]
  this.messageFormatVersion = buffer.char(4)
  this.messages = new Array(buffer.int(3))
  for (var i = 0; i < this.messages.length; i++) {
    this.messages[i] = {
      value: reader.varchar(8),
      vers: reader.char(4),
      messageType: ENUM_MESSAGETYPE[reader.char(2)]
    }
  }
}


/* eslint-enable */
