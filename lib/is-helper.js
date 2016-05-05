'use strict'

const Builder = require('@helpdotcom/build-ast')

function callFnWithName(name) {
  return function(varName) {
    return Builder.callFunction(`validators.${name}`, [
      Builder.ast.objectPath(varName)
    ])
  }
}

const callIsDate = callFnWithName('isDate')
exports.isDate = function isDate(varName) {
  return callIsDate(varName)
}

const callIsEmail = callFnWithName('isEmail')
exports.isEmail = function isEmail(varName) {
  return callIsEmail(varName)
}

const callIsUUID = callFnWithName('isUUID')
exports.isUUID = function isUUID(varName) {
  return callIsUUID(varName)
}
