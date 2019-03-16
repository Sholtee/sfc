/********************************************************************************
*  transpiler.js                                                                *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';
(function(module, require) {
const
    {file, log} = require('grunt'),

    {forEachAsync, filterAsync, isDefined, merge} = require('./utils'),
    {parseNodes}                                  = require('./parser'),
    {mapDst, mapProcessors}                       = require('./mapper'),

    {EOL} = require('os'),
    fs    = require('fs');

module.exports = async function transpile(src, {exts = {}, processors = {}, dstBase, quiet, onTranspileStart = [], onTranspileEnd = []}) {
    exts = merge(exts, {
        template: '.html',
        script:   '.js',
        style:    '.css'
    }, val => `.${val.replace(/^\.+/, '')}`);

    if (!Array.isArray(onTranspileStart)) onTranspileStart = [onTranspileStart];
    if (!Array.isArray(onTranspileEnd))   onTranspileEnd   = [onTranspileEnd];

    processors = mapProcessors(processors, onTranspileStart, onTranspileEnd);

    await forEachAsync(src, async fileSrc => {
        if (!quiet) log.write(`Processing file "${fileSrc}": `);

        var nodes = parseNodes(fs.readFileSync(fileSrc).toString()).filter(node => {
            var {dst, processor, lang} = node.attrs;
            processor = lang || processor;

            if (isDefined(processor)) {
                node.processor = processors[processor];

                if (!node.processor) {
                    if (!quiet) log.writeln(`${EOL}"${node.name}" references undefined processor.`);
                    return false;
                }
            }

            if (isDefined(dst)) {
                node.dst = mapDst(fileSrc, dstBase, exts, node);
            }

            return node;
        });

        onTranspileStart.forEach(hook => hook(fileSrc, nodes));

        nodes = await filterAsync(nodes, async function({name, processor, content, dst}) {
            //
            // 1) Ha nincs processzor akkor az eredeti tartalmat irjuk ki.
            // 2) A processzor akkor is meghivasra kerul ha nincs "dst".
            //

            if (processor) {
                content = processor.call(arguments[0], content);

                //
                // Processzor lehet async.
                //

                if (content instanceof Promise) content = await content;
            }

            if (!content) {
                if (!quiet) log.writeln(`"${name}" has no content to be written out`);
                return false;
            }

            if (!dst) {
                if (!quiet) log.writeln(`"${name}" has no target file (dst)`);
                return false;
            }

            file.write(dst, content);
            return true;
        });

        onTranspileEnd.forEach(hook => hook(fileSrc, nodes));

        if (!quiet) log.writeln(`${nodes.length} file(s) created`);
    });
};
})(module, require);