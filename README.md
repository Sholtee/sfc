# grunt-single-file-component

> A small grunt task which lets you keep all the assets of your component in a (custom) single file

Inspired by VUE.

## Getting Started
If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-single-file-component --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-single-file-component');
```

### Options

#### dstBase (optional)
Type: `string`

The base folder of all the `dst` paths.

#### exts (optional)
Type: `object`

Defines the file extension for the output files if `dst` is a directory.

Defaults to:
```js
{
    template: '.html',
    script: '.js',
    style: '.css'		
}
```

#### processors
Type: `object`

Holds the processor functions in `{processorName: processorFunction}` form. During transpiling the content of each component node will be passed to the corresponding processor.

#### onTranspileStart (optional)
Type: `Function`

Fired before transpiling with the following parameters:

- fileName: The current component file
- nodesToProcess: The nodes about to processing
  
#### onTranspileEnd (optional)
Type: `Function`

Fired after transpiling with the following parameters:

- fileName: The current component file
- nodesProcessed: The successfully processed nodes

## Processor context
Each processor has its own context (accessible via `this`) during execution. This context has the following properties:

#### name
Type: `string`
 
The name of the current node (e.g. "template").

#### dst
Type: `string`

The destination file (of the output).

#### attrs
Type: `object`

All the attributes (e.g. "dst") of the current node (including custom ones).

#### content
Type: `string`

The content of the current node.

#### startIndex
Type: `int`

The start index of the node.

#### endIndex
Type: `int`

The end index of the node.

#### nodeStart
Type: `int`

The start line of the node.

#### nodeEnd
Type: `int`

The end line of the node.

#### contentStart
Type: `int`

The start line of the content.

#### contentEnd
Type: `int`

The end line of the content.

## Usage Example
In your project's Gruntfile, add a section named `sfc` to the data object passed into `grunt.initConfig()`:

```js
grunt.initConfig({
    sfc: {
        your_target: {
            src: ['dummy.component'],
            options: {
                dstBase: '<%= project.dirs.dist %>',
                processors: {
                    pug: require('pug').render,
                    js: function(content){
                        // do something with the content
                        return content;
                    },
                    .
                    .
                    .
                }
            }
        }
    }
});
```

`dummy.component`:

```sfc
<!-- Without "dstBase" "dst" should be "<%= project.dirs.dist %>/views/" -->
<!-- The output file will be named "dummy.html" -->
<template processor="pug" dst="views/">
.foo
  .bar XxX
</template>

<!-- The output file will be named "logic.js" -->
<script processor="js" dst="scripts/logic.js">
console.log('kerekesfacapa');
</script>
.
.
.
```

## Getting the correct line numbers (example)
In the following snippet we're using ESLint to validate `.js` files. Since the linter knows nothing about our component we have to fix the report line numbers manually:

```js
const eslint = new ESLintCli(require('eslint'));
.
.
.
grunt.initConfig({
    sfc: {
        your_target: {
            src: ['*.component'],
            options: {
                processors: {
                    js: function(content){
                        eslint.validate(content, this.nodeStart);
                        return content;
                    },
                    .
                    .
                    .
                }
            }
        }
    }
});
.
.
.
function ESLintCli({CLIEngine}){
    const
        engine = new CLIEngine({
            outputFile:  false,
            quiet:       false,
            maxWarnings: -1,
            failOnError: true,
            configFile:  'eslint.json'
        }),
        formatter = CLIEngine.getFormatter('xXx');

    this.validate = function(data, offset = 0){
        const {errorCount, results} = engine.executeOnText(data);
        
        results.forEach(result => result.messages.forEach(msg => msg.line += offset));
        
        grunt.log.writeln(formatter(results));
        if (errorCount) throw new Error('aborted by ESLint');
    };
}
```

## Referencing the template from your script (example)
Sometimes it can be useful not to hardcode the template path into your script. The following code does the trick:
 
```js
const path = require('path');
.
.
.
grunt.initConfig({
    sfc: {
        your_target: {
            src: ['*.component'],
            options: {
                processors: {
                    js: function(content){
                        // "%%TEMPLATE_URL%%" will act as a magic constant in your script
                        return content.replace(/%%TEMPLATE_URL%%/g, `'${this.$$templateUrl}'`);
                    },
                    .
                    .
                    .
                },
                onTranspileStart: (file, nodes) => {
                    const template = findNode('template');
                    if (!template) return;
                    
                    const script = findNode('script');
                    if (!script) return;
                    
                    const originalDst = template.attrs.dst;
                    
                    script.$$templateUrl = isFile(originalDst)
                        ? originalDst
                        // ".posix" is necessary for proper separating
                        : path.posix.join(originalDst, getFileName(template.dst));
                    
                    function isFile(file) {return !!path.parse(file).ext;}
                    function getFileName(file) {return path.parse(file).base;}
                    function findNode(name) {return nodes.find(node => node.name === name);}
                }
            }
        }
    }
});
```

## Release History
- 0.0.1: Initial release
- 0.0.2: Fixed file naming issue
- 0.0.3: Improved performance
- 0.0.4: Fixed node parsing issue
- 0.0.5: Small improvements
- 0.0.6: User defined file extensions (`exts`) are now merged with the defaults
- 0.0.7: 
  1. Fixed line ending issue
  2. Processors context
- 0.0.8: Added `dstBase` option
- 0.0.9: Added `onTranspileStart` and `onTranspileEnd` hooks
- 0.0.10: More detailed readme