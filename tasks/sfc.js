/********************************************************************************
*  sfc.js                                                                       *
*  Author: Denes Solti                                                          *
********************************************************************************/
(function(module){
'use strict';

const
    fs   = require('fs'),
    path = require('path');

module.exports = sfc;

function sfc(grunt){
    grunt.registerMultiTask('sfc', 'Single File Component', function(){
        sfc.$transpile(grunt, this.filesSrc, this.options());
    });
}

sfc.$transpile = function({template, file, log}, src, {exts, processors, dstBase}){
    exts = this.$mergeExts(exts, {
        template: '.html',
        script:   '.js',
        style:    '.css'
    });

    src.forEach(fileSrc => {
        log.write(`Processing file "${fileSrc}": `);
        var processed = 0;

        this.$parseNodes(fs.readFileSync(fileSrc).toString()).forEach(node => {
            const process = processors[node.attrs.processor];
            if (!process) return;

            var dst = template.process(node.attrs.dst);

            //
            // Ha a node "dst" attributuma konyvtar akkor a kimeneti fajl a forrasfajl
            // nevet es az "exts" szerinti kiterjesztest kapja.
            //
            // Megjegyzes:
            //    NE a grunt.file.isFile()-t hasznaljuk mert az nem letezo utvonalnal
            //    mindig hamissal ter vissza.
            //

            if (!path.parse(dst).ext) dst = path.format({
                dir:  dst,
                name: path.basename(fileSrc, path.extname(fileSrc)),
                ext:  exts[node.name.toLowerCase()]
            });

            if (dstBase) dst = path.join(dstBase, dst);

            //
            // TODO: file extending support
            //

            file.write(dst, process.call(node, node.content));

            processed++;
        });

        log.writeln(`${processed} file(s) created`);
    });
};

sfc.$mergeExts = function(src = {}, dst){
    return Object
        .keys(src)
        .reduce((dict, key) => Object.assign(dict, {
            [key]: `.${src[key].replace(/^\.+/, '')}`
        }), dst);
};

sfc.$parseAttributes = function(input){
    const
        rex = /([\w-]+)(?:=("|')((?:(?!\2|\r\n|\n|\r).)*)\2)/g,
        res = {};

    for(var ar; (ar = rex.exec(input)) != null;){
        const [, key, , value] = ar;
        res[key] = value;
    }

    return res;
};

sfc.$parseNodes = function(input){
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

    function countLinesTo(end, str){
        return str.substring(0, end).split(/\r\n|\n|\r/).length;
    }

    function strip(str){
        return str.replace(/^(\r\n|\n|\r)|(\r\n|\n|\r)$/g, '');
    }
};
})(module);