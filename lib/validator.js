'use strict'

const generator = require('./generate').generate
const checks = require('./checks')
const transformProps = require('./transform-props')
const Builder = require('@helpdotcom/build-ast')
const NanoProp = require('@helpdotcom/nano-prop/lib/base')
const is = require('./is-helper')
const AST = Builder.ast
const E = AST.expression
const S = AST.statement
const D = AST.declaration
const UNARY = E.UNARY

module.exports = class Validator {
  constructor(opts) {
    opts = Object.assign({
      multi: false
    }, opts)

    checks.checkName(opts.name)
    checks.checkProps(opts.props)
    if (!opts.type || typeof opts.type !== 'string') {
      throw new TypeError('Invalid config. `type` (string) is required.')
    }

    this.name = opts.name
    this.type = opts.type
    this._props = opts.props.map((item) => {
      if (typeof item.toJSON === 'function') {
        return item.toJSON()
      }
      return item
    })
    this.props = transformProps(opts.props)

    // multi support is currently limited to multiple objects only
    // TODO(evanlucas) Add support for more than just multi-objects
    this.multi = opts.multi

    this._currentVar = 0

    this.builder = Builder().use('strict')

    // Holds the require statements
    this.builder1 = Builder()

    // Holds the function body
    this.builder2 = Builder()

    // Holds all of the custom types we are using
    this.types = null

    this.variables = new Map()

    // Holds all nodes of the main function body
    this._body = []

    this.toChecks = new Map([ ['obj', true] ])
  }

  get _prefix() {
    if (this.multi) {
      return 'obj.^__IDX__'
    }

    return 'obj'
  }

  _wrapVar(a) {
    return `${this._prefix}.${a}`
  }

  nextVar() {
    return `___${this._currentVar++}`
  }

  _processModule() {
    const typeNames = checks.typeofs.custom
    const types = {}
    for (const t of typeNames) {
      types[t] = false
    }

    for (const prop of this._props) {
      if (checks.isCustomType(prop.type)) {
        types[prop.type] = true
      }

      if (prop.type === 'array' && prop.props) {
        if (Array.isArray(prop.props)) {
          // TODO(evanlucas) recurse down
        } else if (prop.props instanceof NanoProp) {
          const j = prop.props.toJSON()
          if (checks.isCustomType(j)) {
            types[j.type] = true
          }
        }
      }
    }

    if (types.email || types.date || types.uuid) {
      this.builder1
        .declare('const', 'validators', Builder.require('@helpdotcom/is'))
    }

    this.builder1.declare('const', 'has', E.ARROW([
      Builder.id('obj')
    , Builder.id('prop')
    ], Builder.block(
      Builder.returns(Builder.callFunction(
        'Object.prototype.hasOwnProperty.call'
      , [Builder.id('obj'), Builder.id('prop')]
      ))
    )))
    this.types = types
  }

  _topLevelArrayCheck() {
    const em = 'obj must be an array'
    return Builder.ifNot(
      Builder.callFunction('Array.isArray', [
        Builder.id('obj')
      ])
    , Builder.block(returnImmediate([
        Builder.TypeError(em)
      ]))
    )
  }

  _processBody() {
    const name = this.name
    const body = this._body

    body.push(this._checkObjectConditional())

    for (const prop of this.props) {
      this.addCheck(prop, body)
    }

    // If we are multi, then we will wrap (almost) the entire function
    // body in a for loop for each item in the array
    // but we have to first ensure we have an array
    if (this.multi) {
      const i = Builder.id('__IDX__')
      const realBody = [
        this._topLevelArrayCheck()
      , S.FOR(
          D.VAR([
            { type: 'VariableDeclarator', id: i, init: Builder.number(0) }
          ])
        , E.BINARY(i, '<', AST.objectPath('obj.length'))
        , E.UPDATE('++', i, false)
        , Builder.block(body)
        )
      ]
      this._body = realBody
    } else {
      this._body = body
    }

    this._body.push(successCallback())

    this.builder2
      .module(name)
      .function(name, ['obj', 'cb'], this._body)
  }

  generate() {
    this._processModule()
    this._processBody()

    for (const node of this.builder1.body) {
      this.builder.body.push(node)
    }

    for (const node of this.builder2.body) {
      this.builder.body.push(node)
    }

    const out = generator(this.builder.program())
    this._body = []
    return fixup(out)
  }

  addCheck(prop, body) {
    const toChecks = this.toChecks
    const type = prop.type
    if (prop.path) {
      if (toChecks.has(prop.path)) return
      toChecks.set(prop.path, true)
    }

    if (checks.isBuiltinType(type) && type !== 'object') {
      body.push(this._builtinCheck(prop))
    } else if (type === 'object') {
      body.push(...this._builtinObjectCheck(prop))
    } else if (checks.isCustomType(type)) {
      body.push(...this._customCheck(prop))
    } else {
      throw new Error(`(${this.type}): Invalid type: "${type}". Implement me.`)
    }
  }

  _addRegExp(re) {
    const str = re.toString()
    if (this.variables.has(str)) {
      return this.variables.get(str).name
    }

    const varName = this.nextVar()

    const node = Builder.regex(re)
    this.builder1.declare('const', varName, node)
    this.variables.set(str, {
      name: varName
    , node: node
    })

    return varName
  }

  _addEnum(prop) {
    const name = prop.path.replace(/[^\w]/g, '')

    const items = prop.values.map((item) => {
      if (typeof item === 'string') return Builder.string(item)
      if (typeof item === 'number') return Builder.number(item)
      const t = `(${this.type}):`
      throw new TypeError(`${t} Invalid type. Item must be a string or number.`)
    })

    const node = Builder.array(items)
    const varName = `ENUM_${name}`
    this.builder1.declare('const', varName, node)
    this.variables.set(name, {
      name: varName
    , node: node
    })

    return varName
  }

  _customCheck(prop) {
    switch (prop.type) {
      case 'regex':
        return this._addRegexCheck(prop)
      case 'enum':
        return this._addEnumCheck(prop)
      case 'array':
        return this._addArrayCheck(prop)
      default:
        return this._addCustomCheck(prop)
    }
  }

  _addCustomCheck(prop) {
    const wrapped = this._wrapVar(prop.path)
    let test = Builder.not(is[getFunctionName(prop.type)](wrapped))

    const block = returnImmediate([
      this._customTypeError(prop)
    ])

    if (!prop.required) {
      test = Builder.and(this._getHas(prop), test)
      return [Builder.if(test, Builder.block(block))]
    }

    return [Builder.if(test, Builder.block(block))]
  }

  _addArrayCheck(prop) {
    // If there are no props, use the old code path
    // since we won't be validating the type of items in the array
    if (!prop.props) {
      return this._addCustomCheck(prop)
    }

    if (prop.props instanceof NanoProp) {
      return this._addCheckForNanoProp(prop)
    }

    if (Array.isArray(prop.props)) {
      return this._addCheckForArrayProp(prop)
    }

    throw new Error('Array prop.props must be an array or a single NanoProp')
  }

  _addCheckForNanoProp(parent) {
    const prop = parent.props.toJSON()
    if (prop.type === 'array') {
      throw new Error('nested arrays are not current supported')
    }

    const out = []
    const wrapped = this._wrapVar(parent.path)

    const ifNotArrayCheck = Builder.ifNot(
      is[getFunctionName(parent.type)](wrapped)
    , Builder.block(returnImmediate([
        this._customTypeError(parent)
      ]))
    )
    const body = []
    const p = Object.assign({}, prop, {
      path: `${parent.path}.^__IDX__1`
    })
    this.addCheck(p, body)
    const i = Builder.id('__IDX__1')
    const forLoop = S.FOR(
      D.VAR([
        { type: 'VariableDeclarator', id: i, init: Builder.number(0) }
      ])
    , E.BINARY(i, '<', AST.objectPath(`${wrapped}.length`))
    , E.UPDATE('++', i, false)
    , Builder.block(body)
    )

    if (parent.required) {
      out.push(ifNotArrayCheck)

      out.push(forLoop)
    } else {

      const pp = parent.path.replace('^__IDX__1', '')
      const has = this._getHasForPath(pp)
      // const exists = Builder.objectPath(this._wrapVar(pp))
      const top = Builder.if(has, Builder.block([
        ifNotArrayCheck
      , forLoop
      ]))
      out.push(top)
    }

    return out
  }

  _addCheckForArrayProp(prop) {
    console.error('WARNING:', 'setting an Array\'s props to an array is not' +
      'yet supported', prop)
    return []
  }

  _addRegexCheck(prop) {
    const v = this._addRegExp(prop.value)

    const em = `(${this.type}): Path "${prop.path}" must match `
    const err = Builder.Error(
      AST.templateLiteral([Builder.id(v)], [
        AST.templateElement(em, em, false)
      , AST.templateElement('', '', true)
      ])
    )

    let test = Builder.not(Builder.callFunction(`${v}.test`, [
      Builder.objectPath(this._wrapVar(prop.path))
    ]))

    if (!prop.required) {
      test = Builder.and(this._getHas(prop), test)
    }

    return [Builder.if(
      test
    , Builder.block(returnImmediate([err]))
    )]
  }

  _addEnumCheck(prop) {
    const v = this._addEnum(prop)
    const poss = prop.values.map((item) => {
      return JSON.stringify(item)
    }).join(', ')
    const em = `(${this.type}): Path "${prop.path}" must be one of [${poss}]`
    const err = Builder.Error(em)

    let test = Builder.not(UNARY('~', Builder.callFunction(`${v}.indexOf`, [
      Builder.objectPath(this._wrapVar(prop.path))
    ])))

    if (!prop.required) {
      test = Builder.and(this._getHas(prop), test)
    }

    return [Builder.if(test, Builder.block(returnImmediate([err])))]
  }

  _builtinCheck(prop) {
    let test = E.BINARY(
      Builder.typeof(this._wrapVar(prop.path))
    , '!=='
    , Builder.string(prop.type)
    )

    if (!prop.required) {
      test = Builder.and(this._getHas(prop), test)
    }

    const block = returnImmediate([
      this._getBuiltinTypeError(prop)
    ])

    return Builder.if(test, Builder.block(block))
  }

  _checkIsObject(path) {
    return Builder.or(
      Builder.not(Builder.objectPath(path))
    , Builder.notEquals(Builder.typeof(path), Builder.string('object'))
    )
  }

  // only objects can have children
  _builtinObjectCheck(prop) {
    const out = []

    const propPath = this._wrapVar(prop.path)
    let test = this._checkIsObject(propPath)

    const block = [returnImmediate([
      this._getBuiltinTypeError(prop)
    ])]

    if (!prop.required) {
      const body = [
        Builder.if(test, Builder.block(block))
      ]
      if (Array.isArray(prop.children) && prop.children.length) {
        for (const child of prop.children) {
          this.addCheck(child, body)
        }
      }

      out.push(Builder.if(
        this._getHas(prop)
      , Builder.block(body)
      ))
      return out
    }

    out.push(Builder.if(test, Builder.block(block)))

    if (Array.isArray(prop.children) && prop.children.length) {
      for (const child of prop.children) {
        this.addCheck(child, out)
      }
    }

    return out
  }

  _getHas(prop) {
    return this._getHasForPath(prop.path)
  }

  _getHasForPath(p) {
    const path = this._wrapVar(p)
    const splits = path.split('.')
    const right = Builder.string(splits.pop())
    const left = Builder.objectPath(splits.join('.'))
    return Builder.callFunction('has', [
      left
    , right
    ])
  }

  _getBuiltinTypeError(prop) {
    const prefix = `(${this.type}): Missing or invalid param:`
    const type = prop.type
    const path = prop.path
    const ppath = path.replace(/\.\^__IDX__1/g, '[i]')
    if (ppath === path) {
      const errMessage = `${prefix} "${ppath}". Expected ${type}, got `
      return Builder.TypeError(
        AST.templateLiteral([
          Builder.typeof(this._wrapVar(path))
        ], [
          AST.templateElement(errMessage, errMessage, false)
        , AST.templateElement('', '', true)
        ])
      )
    }

    this._getPartsForMessage(path)
    const m1 = `${prefix} "${ppath}". Expected ${type} got`
    return Builder.TypeError(
      AST.templateLiteral([
        Builder.typeof(this._wrapVar(path))
      ], [
        AST.templateElement(m1, m1, false)
      , AST.templateElement('', '', true)
      ])
    )
  }

  _checkObjectConditional() {
    return Builder.if(
      Builder.or(
        Builder.not(Builder.objectPath(this._prefix))
      , Builder.notEquals(
          Builder.typeof(this._prefix)
        , Builder.string('object')
        )
      )
    , Builder.block(returnImmediate([
        Builder.TypeError(`(${this.type}): obj must be an object`)
      ]))
    )
  }

  _customTypeError(prop) {
    const prefix = `(${this.type}): Missing or invalid param:`
    const type = prop.type
    const path = prop.path

    const ppath = path.replace(/\.\^__IDX__1/g, '[i]')
    const errMessage = `${prefix} "${ppath}". Expected ${type}`
    return Builder.TypeError(errMessage)
  }
}

function returnImmediate(args) {
  return Builder.returns(Builder.callFunction('setImmediate', [
    E.ARROW([], Builder.block([
      S.EXPRESSION(Builder.callFunction('cb', args))
    ]))
  ]))
}

function successCallback() {
  return returnImmediate([
    AST.literal(null)
  , Builder.id('obj')]
  )
}

function fixup(str) {
  return wrapDisableEslint(str
    .replace('\'use strict\';', '\'use strict\'\n')
    .replace(/^}/gm, '}\n')
    .replace(/undefined;/gm, 'undefined')
    .replace(/{};/gm, '{}')
    .replace(/\];$/gm, ']')
    .replace(/;$/gm, ''))
}

function wrapDisableEslint(str) {
  return `/* eslint-disable */\n\n${str}`
}

function getFunctionName(type) {
  switch (type) {
    case 'date': return 'isDate'
    case 'email': return 'isEmail'
    case 'uuid': return 'isUUID'
    case 'array': return 'isArray'
    default: throw new Error(`Invalid type: "${type}"`)
  }
}
