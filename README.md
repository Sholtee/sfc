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

Default: `undefined`

The base folder of all the (relative) `dst` paths.

#### exts (optional)
Type: `object`

Default:
```js
{
    template: '.html',
    script: '.js',
    style: '.css'		
}
```

Defines the file extension for the output files if `dst` is a directory. Note
- The object you passed will be merged with the defaults. 
- Dot prefix can be omitted.

*DEPRECATED* use `processor.ext` instead!

#### processors
Type: `object`

Requires or defines processors. 

##### About processors in general

Basically processors are functions to do the transformation of the node content. During transpiling the content of each component node will be passed to the corresponding processor (identified by the `processor` attribute). 

Processors have only one parameter:
- content: The content of the current node to be transpiled
- retVal: The transpiled content to be written out

They may have the following properties:
- `id`: The unique id of the processor (e.g. "pug")
- `ext`: The extension of the output file (e.g. ".html"). If presents it overrides the corresponding `exts` option.
- `onTranspileStart`: An optional hook to be executed before the transpiling process (see below)
- `onTranspileEnd`: An optional hook tobe executed after the transpiling process

##### Defining processors

You can define a processor by adding an entry to the `processors` object in the form of `id: processor`. In this case you can omit the `id` property.

Example:

```js
processors: {
  pug: require('pug').render 
}
```

or 

```js
const renderPug = require('pug').render;
.
.
.
processors: {
  pug: Object.assign(src => renderPug(src), {ext: 'html'}) 
}
```

##### Requiring processors

You can require a processor by adding an entry in the form of `idOrPathOfFactory: optionsObject`. In this case the system tries to load and execute the processor factory with the given options. Processor factory must return a processor function.

Example:

`pug-processor.js`:

```js
const pug = require('pug');

module.exports = function pugProcessorFactory({basedir, scope}) {
    return Object.assign(function pugProcessor(src) {
        return pug.compile(src, {basedir, pretty: true})(scope);
    }, {id: 'pug', ext: '.html'});
};
```

`gruntfile.js`:

```js
processors: {
  'pug-processor': {basedir: '...', scope: {}}
}
```

#### onTranspileStart (optional)
Type: `function | function[]`

Default: `[]`

Fired before transpiling with the following parameters:

- fileName: The current component file
- nodesToProcess: The nodes about to processing
  
#### onTranspileEnd (optional)
Type: `function | function[]`

Default: `[]`

Fired after transpiling with the following parameters:

- fileName: The current component file
- nodesProcessed: The successfully processed nodes

#### quiet (optional)
Type: `boolean`

Default: `false`

Tells the system whether or not output messages to the console. 

## Processor context
Each processor has its own context (accessible via `this`) during execution. This context has the following properties:

#### name
Type: `string`
 
The name of the current node (e.g. "template").

#### dst
Type: `string`

The destination file (of the output). Valid only if the `dst` attribute is set on the current node.

#### attrs
Type: `object`

All the attributes (e.g. "dst") of the current node (including custom ones).

#### content
Type: `string`

The content of the current node.

#### processor
Type: `function`

The processor currently being executed.

#### startIndex
Type: `int`

The start index of the current node.

#### endIndex
Type: `int`

The end index of the current node.

#### nodeStart
Type: `int`

The start line of the current node.

#### nodeEnd
Type: `int`

The end line of the current node.

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
                    js: content => {
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

```xml
<!-- 
  Notes:
    0) Node names must be unique (per component)
    1) At least the "processor" attribute must be set on each node 
    2) Without "dstBase" "dst" should be "<%= project.dirs.dist %>/views/"
    3) The output file will be named "dummy.html" (because "dst" is a folder)
    4) If "dst" is omitted the output of the processor will be treated as void
-->
<template processor="pug" dst="views/">
.foo
  .bar XxX
</template>

<!--
  Notes:
    0) The output file will be named "logic.js" (because "dst" is a file)
-->
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

## Referencing the template URL from your script (example)
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

## Referencing the template content from your script (example)
For example in AngularJS the template can be included in the js file. To achieve this we compile the template first and then we interpolate it back into the script:

`dummy.ng`:

```xml
<!-- 
  Since the order is matter, we have to put the template on the first place so the compiled  
  HTML will be accessible to the following processors.
-->
<template processor="pug" dst="<%= project.dirs.tmp %>/views/">
.foo
  .bar XxX
</template>

<script processor="js" dst="<%= project.dirs.dist %>/scripts/">
console.log(%%TEMPLATE%%);
</script>
.
.
.
```

`gruntfile.js`:

```js
grunt.initConfig({
    sfc: {
        your_target: {
            src: ['*.ng'],
            options: {
                processors: {
                    pug: require('pug').render,
                    js: function(content){
                        const template = grunt.file.read(this.$$templatePath);
                        return content.replace('%%TEMPLATE%%', `'${template}'`);;
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
                    
                    script.$$templatePath = template.dst;
                    
                    function findNode(name) {return nodes.find(node => node.name === name);}
                }
            }
        }
    }
});
```

## Sample processors
In this section you can see a set of sample processors. They are not intended to have their own repository, I just aim them to be a good starting point.

`pug-processor.js`:

```js
(function(module, require) {
const pug = require('pug');

module.exports = function pugProcessorFactory({basedir, scope}) {
    return Object.assign(function pugProcessor(src) {
        src = '\n'.repeat(this.nodeStart) + src; // line number fix
        return pug.compile(src, {basedir, pretty: true})(scope);
    }, {id: 'pug', ext: '.html'});
};
    
})(module, require);
```

`sass-processor.js`:

```js
(function(module, require) {
const sass = require('node-sass');

module.exports = function sassProcessorFactory({basedir}) {
    return Object.assign(function sassProcessor(src) {
        try {
            src = '\n'.repeat(this.nodeStart) + src; // line number fix
            return sass.renderSync({
                data: src,
                indentedSyntax: true,
                includePaths: [basedir],
                outputStyle: 'compressed'
            }).css;
        } catch(e) {
            throw new Error(e.formatted); // throw the proper message
        }
    }, {id: 'sass', ext: '.css'});
};

})(module, require);
```

`js-processor.js`:

```js
(function(module, require) {
const
    path   = require('path'),
    eslint = require('./eslintcli'); // check the implementation out before

module.exports = function jsProcessorFactory() {
    return Object.assign(jsProcessor, {
        id: 'js',
        ext: '.js',
        onTranspileStart
    });
};

function onTranspileStart(file, nodes) {
    const template = findNode('template');
    if (!template) return;

    const script = findNode('script');
    if (!script) return;

    const originalDst = template.attrs.dst;

    script.$$templateUrl = isFile(originalDst)
        ? originalDst
        // ".posix" is necessary for proper separating
        : path.posix.join(originalDst, getFileName(template.dst));

    function findNode(name)    {return nodes.find(node => node.name === name);}
    function isFile(file)      {return !!path.parse(file).ext;}
    function getFileName(file) {return path.parse(file).base;}
};

function jsProcessor(scope = {}) {
    return function jsProcessor(src) {
        const
            scp = Object.assign({}, scope, {TEMPLATE_URL: `'${this.$$templateUrl}'`}),
            result = src.replace(/\$\$(\w+)\$\$/g, (match, id) => id in scp ? scp[id] : match);

        eslint.validate(result, this.nodeStart);
        return result;
    };
}

})(module, require);
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
  2. Processor context
- 0.0.8: Added `dstBase` option
- 0.0.9: Added `onTranspileStart` and `onTranspileEnd` hooks
- 0.0.10:
  1. Processors can return falsy
  2. More detailed readme
- 0.0.11: `dst` is back
- 0.0.12: Fixed missing grunt.template.process() call
- 0.0.13: Added `quiet` option
- 0.0.14: `onTranspileStart` and `onTranspileEnd` can be func[]
- 0.0.15:
  1. Sample processors
  2. Empty nodes are skipped
- 0.0.16
  1. You can suppress "dstBase" by using absolute path
  2. Treat empty "dst" as a valid path