/********************************************************************************
*  sfc.js                                                                       *
*  Author: Denes Solti                                                          *
********************************************************************************/
(function(module, require) {
'use strict';

const
    fs   = require('fs'),
    path = require('path');

module.exports = sfc;

function sfc(grunt) {
    grunt.registerMultiTask('sfc', 'Single File Component', function() {
        sfc.$transpile(grunt, this.filesSrc, this.options());
    });
}

sfc.$transpile = function({template, file, log}, src, {exts, processors, dstBase, onTranspileStart, onTranspileEnd}) {
    exts = this.$mergeExts(exts, {
        template: '.html',
        script:   '.js',
        style:    '.css'
    });

    src.forEach(fileSrc => {
        log.write(`Processing file "${fileSrc}": `);

        var nodes = this.$parseNodes(fs.readFileSync(fileSrc).toString()).map(node => {
            if (node.attrs.dst) node.dst = parseDst(node);
            return node;
        });

        if (isFunction(onTranspileStart)) onTranspileStart(fileSrc, nodes);

        nodes = nodes.filter(node => {
            const process = processors[node.attrs.processor];
            if (!process) return false;

            const result = process.call(node, node.content);
            if (result && node.dst) file.write(node.dst, result);

            return !!result;
        });

        if (isFunction(onTranspileEnd)) onTranspileEnd(fileSrc, nodes);
        
        log.writeln(`${nodes.length} file(s) created`);

        function parseDst({name, attrs: {dst}}){
            dst = template.process(dst);
            
            //
            // Ha a node "dst" attributuma konyvtar akkor a kimeneti fajl a forrasfajl
            // nevet es az "exts" szerinti kiterjesztest kapja.
            //

            if (!isFile(dst)) dst = path.format({
                dir:  dst,
                name: fileNameWithoutExtension(fileSrc),
                ext:  exts[name.toLowerCase()]
            });

            if (dstBase) dst = path.join(dstBase, dst);
            return dst;

            function fileNameWithoutExtension(file) {return path.basename(file, path.extname(file));}

            //
            // NE a grunt.file.isFile()-t hasznaljuk mert az nem letezo utvonalnal
            // mindig hamissal ter vissza.
            //

            function isFile(file) {return !!path.parse(file).ext;}
        }
    });

    function isFunction(value) {return typeof value === 'function';}
};

sfc.$mergeExts = function(src = {}, dst) {
    return Object
        .keys(src)
        .reduce((dict, key) => Object.assign(dict, {
            [key]: `.${src[key].replace(/^\.+/, '')}`
        }), dst);
};

sfc.$parseAttributes = function(input) {
    const
        rex = /([\w-]+)(?:=("|')((?:(?!\2|\r\n|\n|\r).)*)\2)/g,
        res = {};

    for(var ar; (ar = rex.exec(input)) != null;){
        const [, key, , value] = ar;
        res[key] = value;
    }

    return res;
};

sfc.$parseNodes = function(input) {
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
            name:         name,
            attrs:        this.$parseAttributes(rawAttrs),
            content:      content,
            startIndex:   startIndex,
            endIndex:     endIndex,
            nodeStart:    nodeStart,
            nodeEnd:      nodeEnd,
            
            // ugly =(
            contentStart: nodeStart + (rawContent.slice(1) !== content.slice(1) ? 1 : 0),
            contentEnd:   nodeStart + contentLines - (rawContent.slice(-1) !== content.slice(-1) ? 0 : 1)
        });
    }

    return res;

    function countLinesTo(end, str) {return str.substring(0, end).split(/\r\n|\n|\r/).length;}

    function strip(str) {return str.replace(/^(\r\n|\n|\r)|(\r\n|\n|\r)$/g, '');}
};
})(module, require);