/********************************************************************************
*  mapper.js                                                                    *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';
(function(module, require) {
const
    {template} = require('grunt'),
    {fileNameWithoutExtension, isFile} = require('./utils'),
    path  = require('path');

module.exports = class Mapper {
    static mapDst(fileSrc, dstBase, exts, {name, processor: {ext} = {}, attrs: {dst}}) {
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
    }

    static mapProcessors(processors, onTranspileStartHooks, onTranspileEndHooks) {
        return Object.entries(processors).reduce((accu, [key, processor]) => {
            if (typeof processor !== 'function') {
                const {id, onTranspileStart, onTranspileEnd} = processor = require(template.process(key))(processor /*options*/);

                key = id;

                //
                // TODO: ordered hooks
                //

                if (onTranspileStart) onTranspileStartHooks.push(onTranspileStart);
                if (onTranspileEnd)   onTranspileEndHooks.push(onTranspileEnd);
            }

            return Object.assign(accu, {[key]: processor});
        }, {});
    }
};
})(module, require);