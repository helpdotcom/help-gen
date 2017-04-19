'use strict'

// Define first since ArrayType and ObjectType have circular dependencies on it.
exports.getCheck = getCheck

const Prop = require('@helpdotcom/nano-prop')
const ArrayType = require('./array')
const BaseType = require('./base')
const EmailType = require('./email')
const EnumType = require('./enum')
const NumberType = require('./number')
const ObjectType = require('./object')
const RefType = require('./ref')
const RegexType = require('./regex')
const StringType = require('./string')

function getCheck(conf) {
  if (conf.prop.multi) {
    const propWithoutMulti = Object.assign({}, conf.prop)
    delete propWithoutMulti.multi

    conf = Object.assign({}, conf, {
      prop: Prop.array()
                .props(Prop.fromConfig(propWithoutMulti))
                .required(conf.prop.required)
                .path(conf.prop.path)
                .toJSON()
    })

    conf.prop.props.name = propWithoutMulti.name
  }

  const CheckClass = ({
    'array': ArrayType
  , 'boolean': BaseType
  , 'date': BaseType
  , 'email': EmailType
  , 'uuid': BaseType
  , 'url': BaseType
  , 'enum': EnumType
  , 'number': NumberType
  , 'object': ObjectType
  , 'ref': RefType
  , 'regex': RegexType
  , 'string': StringType
  })[conf.prop.type]

  return new CheckClass(conf)
}
