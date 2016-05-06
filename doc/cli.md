# help-gen CLI Tool

```bash
$ npm install --save-dev @helpdotcom/help-gen
```

## Usage

```bash
$ help-gen -h
help-gen - Generate validators for help.com services

  usage: help-gen [options] <command> <input dir> <output dir>

  options:
    -h, --help                    show help and usage
    -v, --version                 show version

  commands:
    validators                    generate validators
    responses                     generate responses

  example:
    $ help-gen validators example/ example/
```

`help-gen` will read all of the files with `.js` or `.json` extensions in
the input directory. Files with the same name and a `.js` extension will
be placed in the output directory.

**Note: It does not recursively read the input directory**.
