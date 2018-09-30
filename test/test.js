/********************************************************************************
 *  test.js                                                                      *
 *  Author: Denes Solti                                                          *
 ********************************************************************************/
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
        '<cica-mica    attr="val"     attr2="</cica-mica>" vmi>\n' +
        'content\n' +
        '</cica-mica>'
    );

    t.equal(ret.length, 1);

    ret = ret[0];

    t.equal(ret.name, 'cica-mica');
    t.equal(ret.content, '\ncontent\n');
    t.equal(Object.getOwnPropertyNames(ret.attrs).length, 2);
    t.equal(ret.attrs.attr, 'val');
    t.equal(ret.attrs.attr2, '</cica-mica>');
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
        t.equal(ret.name, idx == 0 ? 'dog' : 'kitty');
        t.equal(ret.content, '<dog></dog>');
        t.equal(Object.getOwnPropertyNames(ret.attrs).length, 2);
        t.equal(ret.attrs.attr1, 'val');
        t.equal(ret.attrs.attr2, 'kutya');
    });
});

test('transpiling test', t => {
    t.plan(4);

    const
        HTML = 'dst/test.html',
        CSS  = 'dst/my.css';

    try {
        sfc.$transpile(grunt, ['*.component'], {
            processors: {
                html: content => '<!-- cica -->' + content,
                css:  content => content
            }
        });
        
        t.ok(grunt.file.exists(HTML));
        t.ok(grunt.file.exists(CSS));

        t.equal(fs.readFileSync(HTML).toString(), '<!-- cica -->\r\n<div></div>\r\n');
        t.equal(fs.readFileSync(CSS).toString(), '\r\ndiv{display: none;}\r\n');
    } finally {
        grunt.file.delete(HTML);
        grunt.file.delete(CSS);
    }
});
