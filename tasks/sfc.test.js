/********************************************************************************
*  sfc.test.js                                                                  *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {
const
    {EOL} = require('os'),
    {parseNodes} = require('../lib/parser'),

    path  = require('path'),
    fs    = require('fs'),
    grunt = require('grunt'),
    test  = require('tape-promise').default(require('tape')),
    sfc   = require('./sfc'),

    CWD = require('process').cwd(),
    TEST_BASE = path.join(CWD, 'test'),
    DST_BASE  = path.join(TEST_BASE, 'dst');

grunt.initConfig({
    dirs: {
        dst:  DST_BASE,
        test: TEST_BASE
    }
});

[undefined, {}, {template: 'html', style: 'kutya'}, {template: '.html'}].forEach(exts => test(`transpiling test (exts: ${JSON.stringify(exts, null, 0)})`, async t => {
    const
        HTML = path.join(DST_BASE, 'test.html'),
        CSS  = path.join(DST_BASE, 'my.css'); // test.component-ben meg van adva a fajlnev

    t.plan(4);

    await sfc.$transpile([path.join(TEST_BASE, 'test.component')], {
        processors: {
            html: content => '<!-- cica -->' + content,
            css:  content => content
        },
        exts: exts,
        dstBase: TEST_BASE,
        quiet: true
    });

    t.ok(grunt.file.exists(HTML));
    t.ok(grunt.file.exists(CSS));

    t.equal(fs.readFileSync(HTML).toString(), `<!-- cica --><div>${EOL}  <b>kutya</b>${EOL}</div>`);
    t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');

    grunt.file.delete(DST_BASE);
}));

test('transpiling test (no processor)', async t => {
    const HTML = path.join(DST_BASE, 'test_no_processor.html');

    t.plan(2);

    await sfc.$transpile([path.join(TEST_BASE, 'test_no_processor.component')], {dstBase: TEST_BASE, quiet: true});

    t.ok(grunt.file.exists(HTML));
    t.equal(fs.readFileSync(HTML).toString(), `<div>${EOL}  <b>kutya</b>${EOL}</div>`);

    grunt.file.delete(DST_BASE);
});

test('transpiling test (async processor)', async t => {
    const
        HTML = path.join(DST_BASE, 'test.html'),
        CSS  = path.join(DST_BASE, 'my.css');

    t.plan(4);

    await sfc.$transpile([path.join(TEST_BASE, 'test.component')], {
        processors: {
            html: content => new Promise(resolve => setTimeout(resolve('<!-- cica -->' + content), 10)), // async
            css:  content => content
        },
        dstBase: TEST_BASE,
        quiet: true
    });

    t.ok(grunt.file.exists(HTML));
    t.ok(grunt.file.exists(CSS));

    t.equal(fs.readFileSync(HTML).toString(), `<!-- cica --><div>${EOL}  <b>kutya</b>${EOL}</div>`);
    t.equal(fs.readFileSync(CSS).toString(), 'div{display: none;}');

    grunt.file.delete(DST_BASE);
});

test('processor context test', async t => {
    t.plan(3);

    const expectedContext = parseNodes(fs.readFileSync(path.join(TEST_BASE, 'test.component')).toString())[0];

    var context;

    await sfc.$transpile([path.join(TEST_BASE, 'test.component')], {
        processors: {
            html: htmlProcessor
        },
        dstBase: TEST_BASE,
        quiet: true
    });

    t.equal(context.processor, htmlProcessor);
    delete context.processor;

    t.equal(context.dst, path.join(DST_BASE, 'test.html'));
    delete context.dst;

    t.deepEqual(context, expectedContext);

    // eslint-disable-next-line no-invalid-this
    function htmlProcessor() {context = this;} // ha nincs eredmeny akkor nem is irja ki a rendszer a fajlt
});

test('event firing test', async t => {
    const
        COMPONENT = path.join(TEST_BASE, 'test.component'),
        HTML = path.join(DST_BASE, 'test.html');

    t.plan(9);

    await sfc.$transpile([COMPONENT], {
        processors: {
            html: content => content
            // nincs css processor
        },
        exts: {},
        onTranspileStart: (file, nodes) => {
            t.equal(file, COMPONENT);
            t.equal(nodes.length, 1);

            const [template] = nodes;

            t.equal(template.name, 'template');
            t.equal(template.dst.replace('/', path.sep), HTML);
            t.ok(!grunt.file.exists(HTML));
        },
        onTranspileEnd: [(file, nodes) => {
            t.equal(file, COMPONENT);
            t.equal(nodes.length, 1);

            const [template] = nodes;
            t.equal(template.name, 'template');
            t.ok(grunt.file.exists(HTML));
        }],
        dstBase: TEST_BASE,
        quiet: true
    });

    grunt.file.delete(DST_BASE);
});

test('hook setting test', async t => {
    t.plan(1);

    const onTranspileStart = [];

    await sfc.$transpile([path.join(TEST_BASE, 'test.component')], {
        processors: {
            '<%= dirs.test %>/html-processor': {},
            css:  () => {}
        },
        dstBase: TEST_BASE,
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