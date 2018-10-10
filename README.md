# grunt-single-file-component

> A small grunt task which let you keep all the assets of your component in a (custom) single file

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
})
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

## Release History
- 0.0.1: Initial release
- 0.0.2: Fixed file naming issue
- 0.0.3: Improved performance
- 0.0.4: Fixed node parsing issue
- 0.0.5: Small improvements
- 0.0.6: User defined file extensions (`exts`) are now merged with the defaults