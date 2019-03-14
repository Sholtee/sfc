/********************************************************************************
*  parser.test.js                                                               *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {
const
    {EOL} = require('os'),
    test = require('tape'),
    {parseAttributes, parseNodes} = require('parser');

test('attribute parser test', t => {
    t.plan(3);

    const ret = parseAttributes('  attr="val" attr2="kutya" vmi');

    t.equal(Object.getOwnPropertyNames(ret).length, 2);
    t.equal(ret.attr, 'val');
    t.equal(ret.attr2, 'kutya');
});

test('single element parsing test', t => {
    t.plan(6);

    var ret = parseNodes(
        '<!--comment-->'                                            + EOL +
        '<cica-mica    attr-1="val"     attr-2="</cica-mica>" vmi>' + EOL +
        'content'                                                   + EOL +
        '</cica-mica>'
    );

    t.equal(ret.length, 1);

    ret = ret[0];

    t.equal(ret.name, 'cica-mica');
    t.equal(ret.content, 'content');
    t.equal(Object.getOwnPropertyNames(ret.attrs).length, 2);
    t.equal(ret.attrs['attr-1'], 'val');
    t.equal(ret.attrs['attr-2'], '</cica-mica>');
});

test('multi element parsing test', t => {
    t.plan(11);

    const ret = parseNodes(
        '<!--'                                                     + EOL +
        '    comment'                                              + EOL +
        '-->'                                                      + EOL +
        '<dog attr1="val" attr2="kutya" vmi><dog></dog></dog>'     + EOL +
        '<kitty attr1="val" attr2="kutya" vmi><dog></dog></kitty>' + EOL
    );

    t.equal(ret.length, 2);

    ret.forEach((ret, idx) => {
        t.equal(ret.name, idx === 0 ? 'dog' : 'kitty');
        t.equal(ret.content, '<dog></dog>');
        t.equal(Object.getOwnPropertyNames(ret.attrs).length, 2);
        t.equal(ret.attrs.attr1, 'val');
        t.equal(ret.attrs.attr2, 'kutya');
    });
});

test('empty element parsing test', t => {
    t.plan(4);

    var ret = parseNodes(
        '<!--'        + EOL +
        '    comment' + EOL +
        '-->'         + EOL +
        '<dog></dog>'
    );

    t.equal(ret.length, 1);
    ret = ret[0];

    t.equal(ret.name, 'dog');
    t.equal(ret.content, '');
    t.equal(Object.getOwnPropertyNames(ret.attrs).length, 0);
});

test('context test [single line]', t => {
    t.plan(4);

    const ret = parseNodes(
        '<!--comment-->' + EOL +
        '<cica-mica attr-1="val" attr-2="</cica-mica>" vmi>' +
        'content' +
        '</cica-mica>'
    )[0];

    t.equal(ret.nodeStart, 2);
    t.equal(ret.nodeEnd, 2);
    t.equal(ret.contentStart, 2);
    t.equal(ret.contentEnd, 2);
});

test('context test [multi line]', t => {
    t.plan(4);

    const ret = parseNodes(
        '<!--comment-->'                                     + EOL +
        '<cica-mica attr-1="val" attr-2="</cica-mica>" vmi>' + EOL +
                                                               EOL +
        'content'                                            + EOL +
        '</cica-mica>'
    )[0];

    t.equal(ret.nodeStart, 2);
    t.equal(ret.nodeEnd, 5);
    t.equal(ret.contentStart, 3);
    t.equal(ret.contentEnd, 4);
});
})(require);