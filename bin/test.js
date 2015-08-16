var async = require('async');

var build = require('../js/build');
var serve = require("./serve");

/*
* For offline testing: build -> serve
*/
module.exports = function test(options) {
    async.series([
        build,
        serve
    ]);
};
