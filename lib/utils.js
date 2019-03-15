/********************************************************************************
*  utils.js                                                                     *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';
(function(module, require) {
const path = require('path');

module.exports = class Utils {
    static async forEachAsync(ar, cb) {
        for (var i = 0; i < ar.length; i++)
            await cb(ar[i]);
    }

    static async filterAsync(ar, predicate) {
        var
            result = new Array(ar.length),
            c = 0;

        await Utils.forEachAsync(ar, async i => {
            if (await predicate(i)) result[c++] = i;
        });

        result.length = c;
        return result;
    }

    static fileNameWithoutExtension(file) {return path.basename(file, path.extname(file));}

    //
    // NE a grunt.file.isFile()-t hasznaljuk mert az nem letezo utvonalnal
    // mindig hamissal ter vissza.
    //

    static isFile(file) {return !!path.parse(file).ext;}

    static isDefined(val) {return typeof val !== 'undefined';}

    static strip(str) {return str.replace(/^(\r\n|\n|\r)|(\r\n|\n|\r)$/g, '');}

    static countLinesTo(end, str) {return str.substring(0, end).split(/\r\n|\n|\r/).length;}
};

})(module, require);