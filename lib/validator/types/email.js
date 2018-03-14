'use strict'

const Builder = require('@helpdotcom/build-ast')
const Base = require('./base')
const is = require('../../is-helper')

module.exports = class EmailCheck extends Base {
  constructor(...args) {
    super(...args)
  }

  _getTypeof() {
    if (this.prop.allowName === true) {
      return Builder.not(is.isEmailAllowName(this.path))
    }

    return super._getTypeof()
  }

  _callbackWithError(err) {
    const meta = Builder.object({
      original: Builder.objectPath(this.path)
    })
    return this.validator._callbackWithError(err, meta)
  }
}
