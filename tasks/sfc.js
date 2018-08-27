/********************************************************************************
*  sfc.js                                                                       *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

module.exports = grunt => grunt.registerMultiTask('sfc', 'Single File Component', function(){
    const
        options = this.data.options,
        fs      = require('fs'),
        path    = require('path'),
        parse   = require('xml2js').parseString;

    //
    // Vegig a keresesi felteteleknek megfelelo fajlokon. "src"-ben lehet tobb
    // feltetel is -> forEach().
    //

    this.data.src.forEach(src => grunt.file.expand({filter: 'isFile'}, src).forEach(filePath => {
        grunt.log.write('Processing file "' + filePath + '": ');

        //
        // Csomagolas nelkul -tobb node eseten- az elso gyerek lesz a gyoker
        // (az utana levoket pedig figyelmen kivul hagyja az ertelmezo).
        //

        const wrap = '<data>' + sanitizeInput(fs.readFileSync(filePath).toString()) + '</data>';
        parse(wrap, {async: false, normalizeTags: true, explicitRoot: false, attrkey: '$$attrs', charkey: '$$content'}, (err, xml) => {
            if (err) throw err;
            var processed = 0;

            Object.keys(xml)
                //
                // Ugyanazzal a nevvel adott szinten tobb node is lehet ezert ertelmezes
                // utan "nodeName: [{...}, {...}]" formaban lesznek az oljektum
                // property-ei.
                //

                .reduce((ar, curr) => {
                    const exts = options.exts || {
                        template: '.html',
                        script:   '.js',
                        style:    '.css'
                    };

                    //
                    // Minket csak az elso szinten levo csomopontok erdekelnek -> selectMany().
                    // Ugyanitt a node nevebol meg a kiterjesztest is meg tudjuk allapitani
                    // pl.: template -> .html (Object.assign())
                    //

                    ar.push(...xml[curr].map(x => Object.assign({$$ext: exts[curr]}, x)));

                    return ar;
                }, [])
                .forEach(data => {
                    const process = options.processors[data.$$attrs.processor];
                    if (!process) return;

                    //
                    // Ha a node "dst" attributuma konyvtar akkor a kimeneti fajl a forrasfajl
                    // nevet es a fentebb megallapitott kiterjesztest kapja.
                    //
                    
                    var dst = grunt.template.process(data.$$attrs.dst);

                    if (!grunt.file.isFile(dst)) dst = path.format({
                        dir:  dst,
                        name: path.basename(filePath, path.extname(filePath)),
                        ext:  data.$$ext
                    });

                    //
                    // A csomopont tartalmat atadjuk a megfelelo feldolgozonak a kimenetet pedig
                    // a "dst" attributumban megadott fajlba irjuk.
                    //
                    // TODO: file extending support
                    //

                    grunt.file.write(dst, process(data.$$content));
                    processed++;
                });

            grunt.log.writeln(processed + ' file(s) created');
        });

        function sanitizeInput(input){
            return input.replace(/(<(\w+)\b.*>([\s\S]*)<\/\2>)/g, (_void, match, elem, content) => match.replace(content, escape(content, {
                '"': '&quot;',
                "'": '&apos;',
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;'
            })));
            
            function escape(str, chars){
                return str.replace(new RegExp('(' + Object.keys(chars).join('|') + ')', 'g'), (match, char) => chars[char]);
            }
        }
    }));
});