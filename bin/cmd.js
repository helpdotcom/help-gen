#!/usr/bin/env node

'use strict'

const args = process.argv.splice(2)
const help = require('help')()
const pkg = require('../package')
const path = require('path')
const Gen = require('../')
const fs = require('fs')
const mkdirp = require('mkdirp')

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

if (cmd !== 'validators' && cmd !== 'responses') {
  console.log('Invalid command', cmd)
  return help(1)
}

if (args.length !== 3) {
  console.error('Missing input/output directories')
  return help(1)
}

const inputDir = path.resolve(args[1])
const outputDir = path.resolve(args[2])
mkdirp.sync(outputDir)

const exts = ['.json', '.js']

fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error(err.stack || err)
    process.exit(1)
  }

  files = files.filter((file) => {
    return Boolean(~exts.indexOf(path.extname(file)))
  }).map((file) => {
    return path.join(inputDir, file)
  })

  while (files.length) {
    const file = files.shift()
    const config = require(file)
    if (!config.name) {
      throw new Error(`config.json must have a name property (${file})`)
    }

    if (!config.properties) {
      throw new Error(`config.json must have a properties property (${file})`)
    }

    const fn = cmd === 'validators'
      ? Gen.validator
      : Gen.response

    const res = fn(config.name, config.properties)
    let outFile = path.join(outputDir, path.basename(file))
    outFile = outFile.replace(/.json$/, '.js')
    console.log('write', outFile)
    fs.writeFileSync(outFile, res, 'utf8')
  }
})
