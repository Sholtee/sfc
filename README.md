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

## Usage Example
In your project's Gruntfile, add a section named `sfc` to the data object passed into `grunt.initConfig()`:

```js
grunt.initConfig({
    sfc: {
        your_target: {
            src: ['dummy.component'],
            options: {
                // optional extensions (if "dst" does not contain file name), 
                // defaults to:
                exts: {
                    template: '.html',
                    script: '.js',
                    style: '.css'		
                },
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
<!-- The output file will be named "dummy.html" -->
<template processor="pug" dst="<%= project.dirs.dist %>/views/">
.foo
  .bar XxX
</template>

<!-- The output file will be named "logic.js" -->
<script processor="js" dst="<%= project.dirs.dist %>/scripts/logic.js">
console.log('kerekesfacapa');
</script>
.
.
.
```

## Getting the correct line numbers (example)
In the following snippet we're using ESLint to validate `.js` files. Since the linter knows nothing about our component we have to fix the report line numbers manually.

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

## Release History
- 0.0.1: Initial release
- 0.0.2: Fixed file naming issue
- 0.0.3: Improved performance
- 0.0.4: Fixed node parsing issue
- 0.0.5: Small improvements
- 0.0.6: User defined file extensions (`exts`) are now merged with the defaults
- 0.0.7: 
  1. Fixed line ending issue
  2. Processors have their own context (`this`) which includes stuffs (`{name, attrs, content, startIndex, endIndex, nodeStart, nodeEnd, contentStart, contentEnd}`) about the current executing block