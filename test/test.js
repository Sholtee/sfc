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
    test  = require('tape-promise').default(require('tape')),
    {parseNodes} = require('../lib/parser'),
    sfc   = require('../tasks/sfc');

grunt.initConfig({
    dirs: {
        dst: 'dst',
        test: __dirname
    }
});

[undefined, {}, {template: 'html', style: 'kutya'}, {template: '.html'}].forEach(exts => test(`transpiling test (exts: ${JSON.stringify(exts, null, 0)})`, async t => {
    const
        HTML = path.join('dst', 'test.html'),
        CSS  = path.join('dst', 'my.css'); // test.component-ben meg van adva a fajlnev

    t.plan(4);

    await sfc.$transpile(['test.component'], {
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

test('transpiling test (no processor)', async t => {
    const HTML = path.join('dst', 'test_no_processor.html');

    t.plan(2);

    await sfc.$transpile(['test_no_processor.component'], {quiet: true});

    t.ok(grunt.file.exists(HTML));
    t.equal(fs.readFileSync(HTML).toString(), `<div>${EOL}  <b>kutya</b>${EOL}</div>`);

    grunt.file.delete('dst');
});

test('transpiling test (async processor)', async t => {
    const
        HTML = path.join('dst', 'test.html'),
        CSS  = path.join('dst', 'my.css');

    t.plan(4);

    await sfc.$transpile(['test.component'], {
        processors: {
            html: content => new Promise(resolve => setTimeout(resolve('<!-- cica -->' + content), 10)), // async
            css:  content => content
        },
        quiet: true
    });

    t.ok(grunt.file.exists(HTML));
    t.ok(grunt.file.exists(CSS));

    t.equal(fs.readFileSync(HTML).toString(), `<!-- cica --><div>${EOL}  <b>kutya</b>${EOL}</div>`);
    t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');

    grunt.file.delete('dst');
});

test('processor context test', async t => {
    t.plan(3);

    const expectedContext = parseNodes(fs.readFileSync('test.component').toString())[0];

    var context;

    await sfc.$transpile(['test.component'], {
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

test('dstBase test', async t => {
    const
        HTML = path.join('dst', 'test_no_base.html'),
        JS   = path.join('dst', 'test_no_base.js'),
        CSS  = path.join('dst', 'my.css');

    t.plan(6);

    await sfc.$transpile(['test_no_base.component'], {
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

test('event firing test', async t => {
    const HTML = path.join('dst', 'test.html');

    t.plan(9);

    await sfc.$transpile(['test.component'], {
        processors: {
            html: content => content
            // nincs css processor
        },
        exts: {},
        onTranspileStart: (file, nodes) => {
            t.equal(file, 'test.component');
            t.equal(nodes.length, 1);

            const [template] = nodes;

            t.equal(template.name, 'template');
            t.equal(template.dst.replace('/', path.sep), HTML);
            t.ok(!grunt.file.exists(HTML));
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

test('hook setting test', async t => {
    t.plan(1);

    const onTranspileStart = [];

    await sfc.$transpile(['test.component'], {
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
