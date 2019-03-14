/********************************************************************************
*  utils.js                                                                     *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';
(function(module) {

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
            if (predicate(i)) result[c++] = i;
        });

        result.length = c;
        return result;
    }
};

})(module);