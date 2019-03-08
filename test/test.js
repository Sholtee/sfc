/********************************************************************************
 *  test.js                                                                      *
 *  Author: Denes Solti                                                          *
 ********************************************************************************/
(function(require){
'use strict';
const
    {EOL} = require('os'),
    path  = require('path'),
    fs    = require('fs'),
    grunt = require('grunt'),
    test  = require('tape'),
    sfc   = require('../tasks/sfc.js');

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

    const ret = sfc.$parseNodes(
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

    var ret = sfc.$parseNodes(
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

    const ret = sfc.$parseNodes(
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

    const ret = sfc.$parseNodes(
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

[undefined, {}, {template: 'html', style: 'kutya'}, {template: '.html'}].forEach(exts => test(`transpiling test (exts: ${JSON.stringify(exts, null, 0)})`, t => {
    const
        HTML = path.join('dst', 'test.html'),
        CSS  = path.join('dst', 'my.css'); // test.component-ben meg van adva a fajlnev

    t.plan(4);

    sfc.$transpile(['test.component'], {
        processors: {
            html: content => '<!-- cica -->' + content,
            css:  content => content
        },
        exts: exts,
        quiet: true
    });

    t.ok(grunt.file.exists(HTML));
    t.ok(grunt.file.exists(CSS));

    t.equal(fs.readFileSync(HTML).toString(), `<!-- cica --><div>${EOL}  <b>kutya</b>${EOL}</div>`);
    t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');

    grunt.file.delete('dst');
}));

test('processor context test', t => {
    t.plan(3);

    const expectedContext = sfc.$parseNodes(fs.readFileSync('test.component').toString())[0];

    var context;

    sfc.$transpile(['test.component'], {
        processors: {
            html: htmlProcessor
        },
        quiet: true
    });

    t.equal(context.processor, htmlProcessor);
    delete context.processor;

    t.equal(context.dst, path.join('dst', 'test.html'));
    delete context.dst;

    t.deepEqual(context, expectedContext);

    function htmlProcessor() {context = this;} // ha nincs eredmeny akkor nem is irja ki a rendszer a fajlt
});

test('dstBase test', t => {
    const
        HTML = path.join('dst', 'test_no_base.html'),
        JS   = path.join('dst', 'test_no_base.js'),
        CSS  = path.join('dst', 'my.css');

    t.plan(6);

    sfc.$transpile(['test_no_base.component'], {
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

    t.equal(fs.readFileSync(HTML).toString(), `<div>${EOL}  <b>kutya</b>${EOL}</div>`);
    t.equal(fs.readFileSync(JS).toString(), 'console.log("cica");');
    t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');

    grunt.file.delete('dst');
});

test('event firing test', t => {
    const
        HTML = path.join('dst', 'test.html'),
        CSS  = path.join('dst', 'my.css');

    t.plan(12);

    sfc.$transpile(['test.component'], {
        processors: {
            html: content => content
        },
        exts: {},
        onTranspileStart: (file, nodes) => {
            t.equal(file, 'test.component');
            t.equal(nodes.length, 2);

            const [template, style] = nodes;

            t.equal(template.name, 'template');
            t.equal(template.dst.replace('/', path.sep), HTML);
            t.ok(!grunt.file.exists(HTML));

            t.equal(style.name, 'style');
            t.equal(style.dst.replace('/', path.sep), CSS);
            t.ok(!grunt.file.exists(CSS));
        },
        onTranspileEnd: [(file, nodes) => {
            t.equal(file, 'test.component');
            t.equal(nodes.length, 1);

            const [template] = nodes;
            t.equal(template.name, 'template');
            t.ok(grunt.file.exists(HTML));
        }],
        quiet: true
    });

    grunt.file.delete('dst');
});

test('processor querying test', t => {
    const mapped = sfc.$mapProcessors({
        js: jsProcessor,
        '<%= dirs.test %>/html-processor': {foo: 'bar'}
    }, [], []);

    t.plan(6);

    t.equal(Object.keys(mapped).length, 2);
    t.equal(mapped.js, jsProcessor);

    const factory = require('./html-processor');

    t.equal(factory.__callCount, 1);
    t.ok(!!factory.__options);
    t.equal(factory.__options.foo, 'bar');
    t.ok(typeof mapped.html === 'function');

    function jsProcessor(){}
});

test('hook setting test', t => {
    t.plan(1);

    const onTranspileStart = [];

    sfc.$transpile(['test.component'], {
        processors: {
            '<%= dirs.test %>/html-processor': {},
            css:  content => {}
        },
        dstBase: 'dst',
        onTranspileStart,
        quiet: true
    });

    t.equal(onTranspileStart.length, 1);
});

test('task registration test', t => {
    t.plan(2);

    t.ok(!('sfc' in grunt.task._tasks));
    sfc();
    t.ok('sfc' in grunt.task._tasks);
});
})(require);
