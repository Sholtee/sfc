/********************************************************************************
*  sfc.test.js                                                                  *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';

(function(require) {
const
    {task: {_tasks: tasks}} = require('grunt'),
    test  = require('tape'),
    sfc   = require('../sfc');

test('task registration test', t => {
    t.plan(2);

    t.ok(!('sfc' in tasks));
    sfc();
    t.ok('sfc' in tasks);
});
})(require);