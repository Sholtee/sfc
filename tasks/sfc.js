/********************************************************************************
*  sfc.js                                                                       *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';
(function(module, require) {
const
    {registerMultiTask} = require('grunt'),

    transpile = require('../lib/transpiler');

module.exports = function sfc() {
    registerMultiTask('sfc', 'Single File Component', async function() {
        /* eslint-disable no-invalid-this */
        const done = this.async();

        await transpile(this.filesSrc, this.options());
        /* eslint-enable no-invalid-this */

        done();
    });
};
})(module, require);