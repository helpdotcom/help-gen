# help-gen Documentation Generator

The documentation generator should be used with all node service.

It takes a configuration object and can output the documentation in multiple
formats. The formats include:

- JSON
- Markdown
- HTML


## API

### Docs(routes:Array, opts:Object)

Each route must be an object that conforms to the following structure:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `method` | `string` | The HTTP method for this route |
| `path` | `string` | The route url |
| `input` | `array` | An array of the properties in the request body. (This should be a validator's properties) |
| `inputNote` | `string` | An optional note for the request |
| `output` | `array` | An array of properties in the response. (Should be a Response validator's properties) |
| `outputNote` | `string` | An optional note for the response |
| `description` | `string` | The route description |
| `title` | `string` | The title for this route |
| `params` | `array` | An array of properties in the querystring. |

The available options include:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `title` | `string` | The overall title of this set of documentation |
| `toc` | `boolean` | Will include a table of contents for HTML and Markdown formats. (true) |
| `template` | `string` | The HTML template to use. If not provided, a default template will be used |
| `curl` | `boolean` | Will include an example request using `curl` |
| `config` | `array` | Array of config objects for environment variables |

#### Docs#render(format:String)

Format can be one of the following:

- `json`
- `html`
- `markdown`
