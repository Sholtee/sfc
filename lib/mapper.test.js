/********************************************************************************
*  mapper.test.js                                                               *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {

const
    {mapDst, mapProcessors} = require('./mapper'),

    CWD = require('process').cwd(),
    path = require('path'),

    test  = require('tape'),
    grunt = require('grunt');

grunt.initConfig({
    test: 'test',
    res: path.join(CWD, 'test')
});

test('mapDst() should process the template in "dst"', t => {
    t.plan(1);
    t.equal(mapDst(null, null, null, {attrs: {dst: path.join('c:', '<%= test %>', 'cica.txt')}}), path.join('c:', 'test', 'cica.txt'));
});

test('mapDst() should add a file name if "dst" is a folder', t => {
    t.plan(2);
    t.equal(mapDst('cica.component', null, {text: '.txt'}, {name: 'text', attrs: {dst: path.join('c:', 'test')}}), path.join('c:', 'test', 'cica.txt'));
    t.equal(mapDst('cica.component', null, null, {processor: {ext: '.txt'}, attrs: {dst: path.join('c:', 'test')}}), path.join('c:', 'test', 'cica.txt'));
});

test('mapDst() should use "dstBase"', t => {
    t.plan(1);
    t.equal(mapDst('cica.component', 'c:', null, {attrs: {dst: path.join('test', 'cica.txt')}}), path.join('c:', 'test', 'cica.txt'));
});

test('mapDst() should not use "dstBase" if "dst" is absolute', t => {
    t.plan(1);
    t.equal(mapDst('cica.component', 'd:', null, {attrs: {dst: path.join('c:', 'test', 'cica.txt')}}), path.join('c:', 'test', 'cica.txt'));
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