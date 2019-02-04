/********************************************************************************
 *  test.js                                                                      *
 *  Author: Denes Solti                                                          *
 ********************************************************************************/
(function(require){
'use strict';
const
    sfc   = require('../tasks/sfc.js'),
    grunt = require('grunt'),
    fs    = require('fs'),
    test  = require('tape');

grunt.initConfig({
    dirs: {
        dst: 'dst',
        test: __dirname
    }
});

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

test('empty element parsing test', t => {
    t.plan(4);

    var ret = sfc.$parseNodes(
        '<!--\n' +
        '    comment\n' +
        '-->\n' +
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

[undefined, {}, {template: 'html', style: 'kutya'}, {template: '.html'}].forEach(exts => test(`transpiling test (exts: ${JSON.stringify(exts, null, 0)})`, t => {
    const
        HTML = 'dst/test.html',
        CSS  = 'dst/my.css'; // test.component-ben meg van adva a fajlnev

    t.plan(4);

    sfc.$transpile(grunt, ['test.component'], {
        processors: {
            html: content => '<!-- cica -->' + content,
            css:  content => content
        },
        exts: exts,
        quiet: true
    });

    t.ok(grunt.file.exists(HTML));
    t.ok(grunt.file.exists(CSS));

    t.equal(fs.readFileSync(HTML).toString(), '<!-- cica --><div>\r\n  <b>kutya</b>\r\n</div>');
    t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');

    grunt.file.delete(HTML);
    grunt.file.delete(CSS);
}));

test('dstBase test', t => {
    const
        HTML = 'dst/test_no_base.html',
        JS   = 'dst/test_no_base.js',
        CSS  = 'dst/my.css';

    t.plan(6);

    sfc.$transpile(grunt, ['test_no_base.component'], {
        processors: {
            html: content => content,
            css:  content => content,
            js:   content => content
        },
        dstBase: 'dst',
        quiet: true
    });

    t.ok(grunt.file.exists(HTML));
    t.ok(grunt.file.exists(JS));
    t.ok(grunt.file.exists(CSS));

    t.equal(fs.readFileSync(HTML).toString(), '<div>\r\n  <b>kutya</b>\r\n</div>');
    t.equal(fs.readFileSync(JS).toString(), 'console.log("cica");');
    t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');

    grunt.file.delete(HTML);
    grunt.file.delete(JS);
    grunt.file.delete(CSS);
});

test('event firing test', t => {
    const
        HTML = 'dst\\test.html',
        CSS  = 'dst\\my.css';

    t.plan(12);

    sfc.$transpile(grunt, ['test.component'], {
        processors: {
            html: content => content
        },
        exts: {},
        onTranspileStart: (file, nodes) => {
            t.equal(file, 'test.component');
            t.equal(nodes.length, 2);

            const [template, style] = nodes;

            t.equal(template.name, 'template');
            t.equal(template.dst.replace('/', '\\'), HTML);
            t.ok(!grunt.file.exists(HTML));

            t.equal(style.name, 'style');
            t.equal(style.dst.replace('/', '\\'), CSS);
            t.ok(!grunt.file.exists(CSS));
        },
        onTranspileEnd: [(file, nodes) => {
            t.equal(file, 'test.component');
            t.equal(nodes.length, 1);

            const [template] = nodes;
            t.equal(template.name, 'template');
            t.ok(grunt.file.exists(HTML));
            grunt.file.delete(HTML);
        }],
        quiet: true
    });
});
})(require);
