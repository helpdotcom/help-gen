# help-gen

Generate generic validators and models

## Install

```bash
$ npm install [--save-dev] @helpdotcom/help-gen
```

## Documentation

### Prop

A prop represents a base configuration object for a single property
that is intended to be used by a validator or a model.

All properties are required unless `optional()` or `required(false)` is called.

#### Prop.array()

Returns a Prop that represents an [`<Array>`][].

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

// Support validating primitives in arrays
Prop
  .array()
  .path('department_names')
  .required(false)
  .example([
    'General'
  ])
  .props(Prop.string())
  .description('Contains the department names')
```

##### props(prop)

* `prop` `NanoProp` Sets the item validator for an array

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`.

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.boolean()

Returns a Prop that represents a [`<Boolean>`][].

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .boolean()
  .path('accepts_offline_messages')
  .optional()
  .example(false)
  .description('Does the org accept offline messages?')
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

### Prop.date()

Returns a Prop that represents a [`<Date>`][].

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .date()
  .path('modified_at')
  .optional()
  .example(new Date().toISOString())
  .description('The ISO String of the modified date')
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.email()

Returns a Prop that represents a email.

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .email()
  .path('email')
  .example('evan@biscuits.io')
  .description('The user\'s email address')
  .allowName()
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### allowName()

Allow the email format like `Evan Lucas <evanlucas@me.com>`.

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.enum(vals)

* `vals` [`<Array>`][] The accepted values

Returns a Prop that represents an enum.

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .enum(['chat', 'helpdesk', 'voice'])
  .path('channel')
  .required(false)
  .example('chat')
  .description('The department\'s channel')

// Alternative API

Prop
  .enum()
  .values(['chat', 'helpdesk', 'voice'])
  .path('channel')
  .required(false)
  .example('chat')
  .description('The department\'s channel')
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.ip()

Returns a Prop that represents a ip.

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .ip()
  .path('ip')
  .example('172.0.0.1')
  .description('An Ip')
  .allowCIDR()
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### allowCIDR()

Allow the CIDR format like `192.168.100.0/22`.

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.number()

Returns a Prop that represents a [`<Number>`][].

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .number()
  .path('chat_slots')
  .optional()
  .example(3)
  .description('The number of chat slots the agent has available')
  .min(1)
  .max(10)
```

##### min(n)

* `n` [`<Number>`][] Sets the minimum value allowed

Returns `this`

##### max(n)

* `n` [`<Number>`][] Sets the maximum value allowed. Must be > the `min`

Returns `this`

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.object()

Returns a Prop that represents an object.

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .object()
  .path('payload')
  .required(false)
  .example({
    foo: 'bar'
  })
  .props([
    Prop.uuid().path('id')
  , Prop.string().path('name').min(1)
  , Prop.string().path('url').optional().allowNull()
  ])
  .description('Holds the entire payload')
```

##### props(prop)

* `prop` [`<Array>`][] of `NanoProp` Sets the nested object validator props.

**Note: do not include the `path` of the parent in the child path.**

Return `this`

##### passthrough()

Allows all properties returned in this object to passthrough the validator
without being striped

Returns `this`

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.ref(name)

Returns a Prop that represents a reference to another named model/validator.

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .ref('Visitor')
  .path('visitor')
  .description('This is the visitor of the object')

// Alternatively, to mark a reference as an array of references
Prop
  .ref('Visitor')
  .path('visitors')
  .multi()
  .description('List of visitors associated with this room')
```

##### multi()

Sets the `multi` property of the validator or model that we are targeting.
This represents that the reference is for an [`<Array>`][] of objects
that are represented by the named ref.

Returns `this`

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.regex(value)

* `value` [`<String>`][] | [`<RegExp>`][] The regex

Returns a Prop that represents a [`<RegExp>`][].

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .regex(/biscuits/)
  .path('some.random.thing')
  .optional()
  .example('biscuits')
  .description('Whatever')

// Alternative API

Prop
  .regex()
  .value(/biscuits/)
  .path('some.random.thing')
  .optional()
  .example('biscuits')
  .description('Whatever')
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.string()

Returns a Prop that represents a [`<String>`][].

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .string()
  .path('name')
  .required(false)
  .example('Evan')
  .description('Tim will have the reuben')
  .min(1)  // require length of at least 1
  .max(10) // allow length of up to 10
```

##### min(n)

* `n` [`<Number>`][] Sets the min length of the string. Must be >= 0

Returns `this`

##### max(n)

* `n` [`<Number>`][] Sets the max length of the string. Must be > the `min`.

Returns `this`

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.uuid()

Returns a Prop that represents a uuid.

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .uuid()
  .path('id')
  .optional()
  .example('C04DB833-D21C-4C9C-BD5C-16DE42B83207')
  .description('The model id')
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.url()

Returns a Prop that represents a url.

Example:

```js
'use strict'

const {Prop} = require('@helpdotcom/help-gen')

Prop
  .url()
  .path('url')
  .example('http://help.com')
  .description('A URL')
  .allowName()
```

##### path(str)

* `str` [`<String>`][] Sets the `path` property as an object-path (`user.id`)

Returns `this`

##### required(val)

* `val` [`<Boolean>`][] Is this property required?

Returns `this`

##### unique()

Returns `this`

##### optional()

* The property is not required. Same as `required(false)`

Returns `this`

##### description(str)

* `str` [`<String>`][] Sets the description for the property

Returns `this`

##### example(val)

* `val` Sets the example for this property

Returns `this`

##### allowNull()

Allow the property to be null

Returns `this`

##### toJSON()

Returns an object that contains properties describing this property.

***

#### Prop.fromConfig(config)

* `config` [`<Object>`][] The `toJSON()` of a `Prop`

Returns a `Prop` based on `config.type`.

***

#### Prop.fromConfigList(config)

* `config` [`<Config>`] A `doc.json` validator config object

Returns an array of `Prop` objects based on the `type`.

**Note: This method is intended strictly for converting `doc.json` validator
trees back into Prop trees.**

***

#### Prop.isProp(arg)

* `arg` {Any}

Checks if `arg` is an instance of a NanoProp

Returns a [`<Boolean>`][].

***

### Validator

This will generate one-off generic validators.

***

### ModelManager

This will generate a set of models that are able to reference each other.

Every model must have a model config. A model config will look something like
the following:

```js
{ name: 'VisitorJoin'
, type: 'visitor_join'
, includeType: true
, props: [
    Prop.date().path('created_at')
  , Prop.ref('Visitor').path('visitor')
  ]
}
```

#### ModelManager(opts)

* `opts` [`<Object>`][]
  * `root` [`<String>`][] The root path
  * `configs` [`<Array>`][] Array of model configs

Example:

```js
'use strict'

const Manager = require('@helpdotcom/nano-model')
const manager = new Manager({
  configs: [
    { name: 'Visitor'
    , type: 'visitor'
    , props: [
        { name: 'Visitor'
        , type: 'visitor'
        , props: [
            Prop.uuid().path('id')
          , Prop.string().path('name')
          ]
        }
      , { name: 'VisitorJoin'
        , type: 'visitor_join'
        , includeType: true
        , props: [
            Prop.date().path('created_at')
          , Prop.ref('Visitor').path('visitor').optional()
          ]
        }
      ]
    }
  ]
})

const out = manager.generate()

// To write all of the models, one can do something like this:
const fs = require('fs')
const path = require('path')
const MODELS_DIR = path.join(process.cwd(), 'models')

for (const item of out.values()) {
  const fp = path.join(MODELS_DIR, item.filename)
  fs.writeFileSync(fp, item.code, 'utf8')
}
```

##### define(conf)

* `conf` [`<Object>`][] A single model config
  * `name` [`<String>`][] The constructor name
  * `type` [`<String>`][] The type of the model
  * `props` [`<Array>`][] Each item must be a [`NanoProp`][]
  * `includeType` [`<Boolean>`][] Should toJSON() include the type?

##### generate()

Returns a [`<Map>`][] where the key is the model name and the value is an
object like:

```js
{ code: ''                // Will be the actual code
, filename: 'visitor.js'  // Will be the filename (does not include the path)
}
```

***

## Test

```bash
$ npm test
```

## Author

Evan Lucas

## License

MIT (See `LICENSE` for more info)

[`<Array>`]: https://mdn.io/array
[`<Boolean>`]: https://mdn.io/boolean
[`<Date>`]: https://mdn.io/date
[`<Map>`]: https://mdn.io/map
[`<Number>`]: https://mdn.io/number
[`<Object>`]: https://mdn.io/object
[`<RegExp>`]: https://mdn.io/RegExp
[`<String>`]: https://mdn.io/string
[`NanoProp`]: https://git.help.com/common-backend/nano-prop
