/********************************************************************************
*  sfc.js                                                                       *
*  Author: Denes Solti                                                          *
********************************************************************************/
(function(module, require) {
'use strict';

const
    fs   = require('fs'),
    path = require('path');

module.exports = Object.assign(function sfc(grunt) {
    grunt.registerMultiTask('sfc', 'Single File Component', function() {
        sfc.$transpile(grunt, this.filesSrc, this.options());
    });
}, {

$transpile: function({template, file, log}, src, {exts, processors, dstBase, quiet, onTranspileStart = [], onTranspileEnd = []}) {
    exts = this.$mergeExts(exts, {
        template: '.html',
        script:   '.js',
        style:    '.css'
    });

    if (!Array.isArray(onTranspileStart)) onTranspileStart = [onTranspileStart];
    if (!Array.isArray(onTranspileEnd))   onTranspileEnd   = [onTranspileEnd];

    processors = this.$mapProcessors(processors, onTranspileStart, onTranspileEnd);

    src.forEach(fileSrc => {
        if (!quiet) log.write(`Processing file "${fileSrc}": `);

        var nodes = this.$parseNodes(fs.readFileSync(fileSrc).toString()).map(node => {
            const {dst, processor} = node.attrs;

            if (isDefined(processor)) node.processor = processors[processor];
            if (isDefined(dst))       node.dst       = parseDst(node);

            return node;

            function isDefined(val) {return typeof val !== 'undefined';}
        });

        onTranspileStart.forEach(hook => hook(fileSrc, nodes));

        nodes = nodes.filter(function({processor, content, dst}) {
            if (!processor || !content) return false;

            const result = processor.call(arguments[0], content);
            if (result && dst) file.write(dst, result);

            return !!result;
        });

        onTranspileEnd.forEach(hook => hook(fileSrc, nodes));
        
        if (!quiet) log.writeln(`${nodes.length} file(s) created`);

        function parseDst({name, processor: {ext} = {}, attrs: {dst}}){
            dst = template.process(dst);
            
            //
            // Ha a node "dst" attributuma konyvtar akkor a kimeneti fajl a forrasfajl
            // nevet es az "exts" szerinti kiterjesztest kapja.
            //

            if (!isFile(dst)) dst = path.format({
                dir:  dst,
                name: fileNameWithoutExtension(fileSrc),
                ext:  ext || exts[name.toLowerCase()]
            });

            if (dstBase && !path.isAbsolute(dst)) dst = path.join(dstBase, dst);
            return dst;

            function fileNameWithoutExtension(file) {return path.basename(file, path.extname(file));}

            //
            // NE a grunt.file.isFile()-t hasznaljuk mert az nem letezo utvonalnal
            // mindig hamissal ter vissza.
            //

            function isFile(file) {return !!path.parse(file).ext;}
        }
    });
},

$mapProcessors: function(processors, onTranspileStartHooks, onTranspileEndHooks) {
    return Object.entries(processors).reduce((accu, [key, processor]) => {
        if (typeof processor !== 'function') {
            const {id, onTranspileStart, onTranspileEnd} = processor = require(key)(processor /*options*/);

            key = id;

            //
            // TODO: ordered hooks
            //
            
            if (onTranspileStart) onTranspileStartHooks.push(onTranspileStart);
            if (onTranspileEnd)   onTranspileEndHooks.push(onTranspileEnd);
        }

        return Object.assign(accu, {[key]: processor});
    }, {});
},

$mergeExts: function(src = {}, dst) {
    return Object
        .keys(src)
        .reduce((dict, key) => Object.assign(dict, {
            [key]: `.${src[key].replace(/^\.+/, '')}`
        }), dst);
},

$parseAttributes: function(input) {
    const
        rex = /([\w-]+)(?:=("|')((?:(?!\2|\r\n|\n|\r).)*)\2)/g,
        res = {};

    for(var ar; (ar = rex.exec(input)) != null;){
        const [, key, , value] = ar;
        res[key] = value;
    }

    return res;
},

$parseNodes: function(input) {
    const
        rex = /<([\w-]+)\b((?:[ \t]*[\w-]+(?:=("|')((?:(?!\3|\r\n|\n|\r).)*)\3))*)[\w \t-]*>([\s\S]*)<\/\1>$/gm,
        res = [];

    for(var ar; (ar = rex.exec(input)) != null;) {
        const
            [, name, rawAttrs, , , rawContent] = ar,

            startIndex   = ar.index,
            endIndex     = rex.lastIndex,
            content      = strip(rawContent),

            nodeStart    = countLinesTo(startIndex, input),
            nodeEnd      = countLinesTo(endIndex + 1, input),
            contentLines = countLinesTo(content.length, content);

        res.push({
            name,
            content,
            startIndex,
            endIndex,
            nodeStart,
            nodeEnd,

            attrs: this.$parseAttributes(rawAttrs),
            
            // ugly =(
            contentStart: nodeStart + (rawContent.slice(1) !== content.slice(1) ? 1 : 0),
            contentEnd:   nodeStart + contentLines - (rawContent.slice(-1) !== content.slice(-1) ? 0 : 1)
        });
    }

    return res;

    function countLinesTo(end, str) {return str.substring(0, end).split(/\r\n|\n|\r/).length;}

    function strip(str) {return str.replace(/^(\r\n|\n|\r)|(\r\n|\n|\r)$/g, '');}
}
});
})(module, require);