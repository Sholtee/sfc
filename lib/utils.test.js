/********************************************************************************
*  utils.test.js                                                                *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {

const
    utils = require('./utils'),
    test  = require('tape-promise').default(require('tape'));

test('forEachAsync() test', async t => {
    t.plan(1);

    const
        src = [20, 10, 5],
        dst = [];

    await utils.forEachAsync(src, async ms => {
        await sleep(ms);
        dst.push(ms);
    });

    t.deepEqual(src, dst);
});

test('filterAsync() test', async t => {
    t.plan(1);

    const filtered = await utils.filterAsync([1, 2, 3, 4], async i => {
        await sleep(10);
        return i % 2 === 0;
    });

    t.deepEqual([2, 4], filtered);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

})(require);