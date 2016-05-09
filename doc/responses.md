# help-gen Response Validation Generator

The response validation generator should be used with all node services that
require HTTP response validation.

```js
'use strict'

const gen = require('@helpdotcom/help-gen').response
const props = []
const name = 'CreateUser'
console.log(gen(name, props))

// or you can use the constructor yourself.
const Validator = require('@helpdotcom/help-gen').response.Response
const props = []
const name = 'CreateUser'
const validator = new Validator(name, props)
console.log(validator.generate())
```

Also, see the [CLI Tool](cli.md) for easier use.

## API

### generate(name, props)

* `name` [`<String>`][] The model name.
  * Must be a valid identifier.
  * Should match the following regex: `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/`
* `props` [`<Array>`][] Array of property config objects.
  * See below for property config objects.

Returns a [`<String>`][].

## Config Properties

The config objects can have the following properties:

* `name` **(Required)** [`<String>`][] The property name
* `path` **(Required)** [`<String>`][] The property path.
  * Will be parsed as an dot delimited object-path.
  * `user.id` will be parsed as `{ user: { id: '' }}`.
* `type` **(Required)** [`<String>`][] Must be one of the following:
  * `object`
  * `boolean`
  * `number`
  * `string`
  * `uuid`
  * `date`
  * `regex`
  * `email`
  * `array`
  * `enum`
* `required` *(Optional)* [`<Boolean>`][] Is this property required?
* `description` *(Optional)* [`<String>`][] The description used in the
generated documentation.
* `example` *(Optional)* An example for use in the generated documentation.
* `values` **(Required if type is `enum`)** [`<Array>`][] array of possible
  values.

[`<Array>`]: https://mdn.io/array
[`<Boolean>`]: https://mdn.io/boolean
[`<String>`]: https://mdn.io/string
