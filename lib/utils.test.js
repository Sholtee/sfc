/********************************************************************************
*  utils.test.js                                                                *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {

const
    {forEachAsync, filterAsync, isFile, fileNameWithoutExtension, isDefined, strip, countLinesTo} = require('./utils'),
    test  = require('tape-promise').default(require('tape'));

test('forEachAsync() test', async t => {
    t.plan(1);

    const
        src = [20, 10, 5],
        dst = [];

    await forEachAsync(src, async ms => {
        await sleep(ms);
        dst.push(ms);
    });

    t.deepEqual(src, dst);
});

test('filterAsync() test', async t => {
    t.plan(1);

    const filtered = await filterAsync([1, 2, 3, 4], async i => {
        await sleep(10);
        return i % 2 === 0;
    });

    t.deepEqual([2, 4], filtered);
});

test('isFile() test', t => {
    t.plan(3);

    t.ok(isFile('cica/kutya.txt'));
    t.notOk(isFile('cica'));
    t.notOk(isFile(''));
});

test('fileNameWithoutExtension() test', t => {
    t.plan(3);

    t.equal(fileNameWithoutExtension('cica.txt'), 'cica');
    t.equal(fileNameWithoutExtension('kutya/cica.txt'), 'cica');
    t.equal(fileNameWithoutExtension(''), '');
});

test('isDefined() test', t => {
    t.plan(6);

    t.notOk(isDefined(undefined));
    t.ok(isDefined(null));
    t.ok(isDefined(''));
    t.ok(isDefined(0));
    t.ok(isDefined({}));
    t.ok(isDefined(false));
});

test('strip() test', t => {
    t.plan(6);

    t.equal(strip('\rcica\n'),     'cica');
    t.equal(strip('\r\ncica\r\n'), 'cica');
    t.equal(strip('cica\n'),       'cica');
    t.equal(strip('\rcica'),       'cica');

    //
    // Csak az elso elofordulast torli
    //

    t.equal(strip('\r\rcica\n\n'), '\rcica\n');
    t.equal(strip('\r\n\r\ncica'), '\r\ncica');
});

test('countLinesTo() test', t => {
    t.plan(5);

    t.equal(countLinesTo(10, '\r\ncica\nmica'), 3);
    t.equal(countLinesTo(0,  '\r\ncica\nmica'), 1);
    t.equal(countLinesTo(5,  '\r\ncica\nmica'), 2);
    t.equal(countLinesTo(4,  'cica'),   1);
    t.equal(countLinesTo(5,  'cica\n'), 2);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

})(require);