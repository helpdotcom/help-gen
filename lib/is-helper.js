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

const callIsEmailAllowName = callFnWithName('isEmailAllowName')
exports.isEmailAllowName = function isEmailAllowName(varName) {
  return callIsEmailAllowName(varName)
}

const callIsUUID = callFnWithName('isUUID')
exports.isUUID = function isUUID(varName) {
  return callIsUUID(varName)
}

exports.isArray = function isArray(varName) {
  return Builder.callFunction('Array.isArray', [
    Builder.ast.objectPath(varName)
  ])
}
