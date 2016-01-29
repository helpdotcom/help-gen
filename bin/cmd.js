#!/usr/bin/env node

'use strict'

const args = process.argv.splice(2)
const help = require('help')()
const pkg = require('../package')
const path = require('path')
const Gen = require('../')

const helpArgs = ['-h', '--help', 'help']
const versionArgs = ['-v', '--version', 'version']

if (!args.length) {
  return help(1)
}

const cmd = args[0]
if (~helpArgs.indexOf(cmd)) {
  return help()
}

if (~versionArgs.indexOf(cmd)) {
  console.log('help-gen', `v${pkg.version}`)
  return
}

const config = require(path.resolve(cmd))

if (!config.name) {
  throw new Error('config.json must have a name property')
}

if (!config.properties) {
  throw new Error('config.json must have a properties property')
}

const res = Gen(config.name, config.properties)
console.log(res)
