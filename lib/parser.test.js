/********************************************************************************
*  parser.test.js                                                               *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {
const
    {EOL} = require('os'),
    test = require('tape'),
    {parseAttributes, parseNodes} = require('./parser');

test('attribute parser test', t => {
    t.plan(4);

    const ret = parseAttributes('  attr="val" attr2=""  attr3');

    t.equal(Object.getOwnPropertyNames(ret).length, 3);
    t.equal(ret.attr, 'val');
    t.equal(ret.attr2, '');
    t.equal(ret.attr3, true);
});

test('single element parsing test', t => {
    t.plan(7);

    var ret = parseNodes(
        '<!--comment-->'                                                 + EOL +
        '<cica-mica    attr-1="val"     attr-2="</cica-mica>" attr-3  >' + EOL +
        'content'                                                        + EOL +
        '</cica-mica>'
    );

    t.equal(ret.length, 1);

    ret = ret[0];

    t.equal(ret.name, 'cica-mica');
    t.equal(ret.content, 'content');
    t.equal(Object.getOwnPropertyNames(ret.attrs).length, 3);
    t.equal(ret.attrs['attr-1'], 'val');
    t.equal(ret.attrs['attr-2'], '</cica-mica>');
    t.equal(ret.attrs['attr-3'], true);
});

test('multi element parsing test', t => {
    t.plan(13);

    const ret = parseNodes(
        '<!--'                                                  + EOL +
        '    comment'                                           + EOL +
        '-->'                                                   + EOL +
        '<dog attr1="val" attr2="" attr3  ><dog></dog></dog>'   + EOL +
        '<kitty attr1="val" attr2="" attr3><dog></dog></kitty>' + EOL
    );

    t.equal(ret.length, 2);

    ret.forEach((ret, idx) => {
        t.equal(ret.name, idx === 0 ? 'dog' : 'kitty');
        t.equal(ret.content, '<dog></dog>');
        t.equal(Object.getOwnPropertyNames(ret.attrs).length, 3);
        t.equal(ret.attrs.attr1, 'val');
        t.equal(ret.attrs.attr2, '');
        t.equal(ret.attrs.attr3, true);
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
    t.deepEqual(ret.attrs, {});
});

test('context test [single line]', t => {
    t.plan(4);

    const ret = parseNodes(
        '<!--comment-->' + EOL +
        '<cica-mica attr-1="val" attr-2="</cica-mica>" attr-3>' +
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
        '<!--comment-->'                                        + EOL +
        '<cica-mica attr-1="val" attr-2="</cica-mica>" attr-3>' + EOL +
                                                                  EOL +
        'content'                                               + EOL +
        '</cica-mica>'
    )[0];

    t.equal(ret.nodeStart, 2);
    t.equal(ret.nodeEnd, 5);
    t.equal(ret.contentStart, 3);
    t.equal(ret.contentEnd, 4);
});
})(require);