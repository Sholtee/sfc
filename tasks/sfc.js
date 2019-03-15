/********************************************************************************
*  sfc.js                                                                       *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';
(function(module, require) {
const
    {registerMultiTask, file, log} = require('grunt'),

    {forEachAsync, filterAsync, isDefined} = require('../lib/utils'),
    {parseNodes} = require('../lib/parser'),
    {mapDst, mapProcessors} = require('../lib/mapper'),

    {EOL} = require('os'),
    fs    = require('fs');

module.exports = Object.assign(function sfc() {
    registerMultiTask('sfc', 'Single File Component', async function() {
        /* eslint-disable no-invalid-this */
        const done = this.async();

        await sfc.$transpile(this.filesSrc, this.options());
        /* eslint-enable no-invalid-this */

        done();
    });
}, {

$transpile: async function(src, {exts = {}, processors = {}, dstBase, quiet, onTranspileStart = [], onTranspileEnd = []}) {
    exts = this.$mergeExts(exts, {
        template: '.html',
        script:   '.js',
        style:    '.css'
    });

    if (!Array.isArray(onTranspileStart)) onTranspileStart = [onTranspileStart];
    if (!Array.isArray(onTranspileEnd))   onTranspileEnd   = [onTranspileEnd];

    processors = mapProcessors(processors, onTranspileStart, onTranspileEnd);

    await forEachAsync(src, async fileSrc => {
        if (!quiet) log.write(`Processing file "${fileSrc}": `);

        var nodes = parseNodes(fs.readFileSync(fileSrc).toString()).filter(node => {
            const {dst, processor} = node.attrs;

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
},

$mergeExts: function(src, dst) {
    return Object
        .keys(src)
        .reduce((dict, key) => Object.assign(dict, {
            [key]: `.${src[key].replace(/^\.+/, '')}`
        }), dst);
}
});
})(module, require);