/********************************************************************************
 *  test.js                                                                      *
 *  Author: Denes Solti                                                          *
 ********************************************************************************/
(function(){
'use strict';
const
    sfc   = require('../tasks/sfc.js'),
    grunt = require('grunt'),
    fs    = require('fs'),
    test  = require('tape');

test('attribute parser test', t => {
    t.plan(3);

    const ret = sfc.$parseAttributes('  attr="val" attr2="kutya" vmi');

    t.equal(Object.getOwnPropertyNames(ret).length, 2);
    t.equal(ret.attr, "val");
    t.equal(ret.attr2, "kutya");
});

test('single element parsing test', t => {
    t.plan(6);

    var ret = sfc.$parseNodes(
        '<!--comment-->\n' +
        '<cica-mica    attr-1="val"     attr-2="</cica-mica>" vmi>\n' +
        'content\n' +
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

test('context test [single line]', t => {
    t.plan(4);

    const ret = sfc.$parseNodes(
        '<!--comment-->\n' +
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

    const ret = sfc.$parseNodes(
        '<!--comment-->\n' +
        '<cica-mica attr-1="val" attr-2="</cica-mica>" vmi>\n' +
        '\n' +
        'content\n' +
        '</cica-mica>'
    )[0];

    t.equal(ret.nodeStart, 2);
    t.equal(ret.nodeEnd, 5);
    t.equal(ret.contentStart, 3);
    t.equal(ret.contentEnd, 4);
});

test('multi element parsing test', t => {
    t.plan(11);

    const ret = sfc.$parseNodes(
        '<!--\n' +
        '    comment\n' +
        '-->\n' +
        '<dog attr1="val" attr2="kutya" vmi><dog></dog></dog>\n' +
        '<kitty attr1="val" attr2="kutya" vmi><dog></dog></kitty>\n'
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

[undefined, {}, {template: 'html', style: 'kutya'}, {template: '.html'}].forEach(exts => test('transpiling test (exts: ' + JSON.stringify(exts, null, 0) + ')', t => {
    const
        HTML = 'dst/test.html',
        CSS  = 'dst/my.css'; // test.component-ben meg van adva a fajlnev

    t.plan(4);
    try {
        sfc.$transpile(grunt, ['test.component'], {
            processors: {
                html: content => '<!-- cica -->' + content,
                css:  content => content
            },
            exts: exts
        });
        
        t.ok(grunt.file.exists(HTML));
        t.ok(grunt.file.exists(CSS));

        t.equal(fs.readFileSync(HTML).toString(), '<!-- cica --><div>\r\n  <b>kutya</b>\r\n</div>');
        t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');
    } finally {
        grunt.file.delete(HTML);
        grunt.file.delete(CSS);
    }
}));
})();
