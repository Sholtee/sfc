/********************************************************************************
*  mapper.test.js                                                               *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {

const
    {mapDst, mapProcessors} = require('./mapper'),

    CWD      = require('process').cwd(),
    path     = require('path'),
    PLATFORM = require('os').platform(),

    test  = require('tape'),
    grunt = require('grunt'),

    ROOT_1 = PLATFORM === 'win32' ? 'c:' : '/foo',
    ROOT_2 = PLATFORM === 'win32' ? 'd:' : '/bar';

grunt.initConfig({
    test: 'test',
    res: path.join(CWD, 'test')
});

test('mapDst() should process the template in "dst"', t => {
    t.plan(1);
    t.equal(mapDst(null, null, null, {attrs: {dst: path.join(ROOT_1, '<%= test %>', 'cica.txt')}}), path.join(ROOT_1, 'test', 'cica.txt'));
});

test('mapDst() should add a file name if "dst" is a folder', t => {
    t.plan(2);
    t.equal(mapDst('cica.component', null, {text: '.txt'}, {name: 'text', attrs: {dst: path.join(ROOT_1, 'test')}}), path.join(ROOT_1, 'test', 'cica.txt'));
    t.equal(mapDst('cica.component', null, null, {processor: {ext: '.txt'}, attrs: {dst: path.join(ROOT_1, 'test')}}), path.join(ROOT_1, 'test', 'cica.txt'));
});

test('mapDst() should handle the missing dot', t => {
    t.plan(2);
    t.equal(mapDst('cica.component', null, {text: 'txt'}, {name: 'text', attrs: {dst: ''}}), 'cica.txt');
    t.equal(mapDst('cica.component', null, null, {processor: {ext: 'txt'}, attrs: {dst: ''}}), 'cica.txt');
});

test('mapDst() should throw if no ext found', t => {
    t.plan(1);
    t.throws(() => mapDst('cica.component', null, {}, {name: 'text', attrs: {dst: ''}}), 'No extension found for node "text"');
});

test('mapDst() should use "dstBase"', t => {
    t.plan(1);
    t.equal(mapDst('cica.component', ROOT_1, null, {attrs: {dst: path.join('test', 'cica.txt')}}), path.join(ROOT_1, 'test', 'cica.txt'));
});

test('mapDst() should not use "dstBase" if "dst" is absolute', t => {
    t.plan(1);
    t.equal(mapDst('cica.component', ROOT_2, null, {attrs: {dst: path.join(ROOT_1, 'test', 'cica.txt')}}), path.join(ROOT_1, 'test', 'cica.txt'));
});

test('processor querying test', t => {
    const factory = require('../test/html-processor');
    factory.reset();

    const
        opts = {foo: 'bar'},
        mapped = mapProcessors({
            js: jsProcessor,
            '<%= res %>/html-processor': opts
        }, [], []);

    t.plan(5);

    t.equal(Object.keys(mapped).length, 2);
    t.equal(mapped.js, jsProcessor);
    t.equal(factory.__callCount, 1);
    t.equal(factory.__options, opts);
    t.equal(mapped.html, factory.__processor);

    function jsProcessor() {}
});

})(require);