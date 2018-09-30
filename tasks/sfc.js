/********************************************************************************
*  sfc.js                                                                       *
*  Author: Denes Solti                                                          *
********************************************************************************/
(function(){
'use strict';

const
    fs   = require('fs'),
    path = require('path');

module.exports = sfc;

function sfc(grunt){
    grunt.registerMultiTask('sfc', 'Single File Component', function(){
        sfc.$transpile(grunt, this.data.src, this.data.options);
    });
}

sfc.$transpile = function(grunt, src, options){
    const exts = options.exts || {
        template: '.html',
        script:   '.js',
        style:    '.css'
    };

    src.forEach(src => grunt.file.expand({filter: 'isFile'}, src).forEach(filePath => {
        grunt.log.write('Processing file "' + filePath + '": ');
        var processed = 0;

        this.$parseNodes(fs.readFileSync(filePath).toString()).forEach(node => {
            const process = options.processors[node.attrs.processor];
            if (!process) return;

            //
            // Ha a node "dst" attributuma konyvtar akkor a kimeneti fajl a forrasfajl
            // nevet es az "exts" szerinti kiterjesztest kapja.
            //
            // Megjegyzes:
            //    NE a grunt.file.isFile()-t hasznaljuk mert az nem letezo utvonalnal
            //    mindig hamissal ter vissza.
            //

            var dst = grunt.template.process(node.attrs.dst);

            if (!path.parse(dst).ext) dst = path.format({
                dir:  dst,
                name: path.basename(filePath, path.extname(filePath)),
                ext:  exts[node.name.toLowerCase()]
            });
            
            //
            // TODO: file extending support
            //

            grunt.file.write(dst, process(node.content));

            processed++;
        });

        grunt.log.writeln(processed + ' file(s) created');
    }));
};

sfc.$parseAttributes = function(input){
    const
        rex = /(\S+)(?:=("|')((?:(?!\2|\n).)*)\2)/g,
        res = {};

    for(var ar; (ar = rex.exec(input)) != null;){
        res[ar[1]] = ar[3];
    }

    return res;
};

sfc.$parseNodes = function(input){
    const
        rex = /<([\w-]+)\b((?:\s*\S+(?:=("|')((?:(?!\3|\n).)*)\3))*)(?:(?!>).)*>([\s\S]*)<\/\1>$/gm,
        res = [];

    for(var ar; (ar = rex.exec(input)) != null;) res.push({
        name:    ar[1],
        attrs:   this.$parseAttributes(ar[2]),
        content: ar[5]
    });

    return res;
};
})();