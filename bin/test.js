var async = require('async');
var logger = require('../js/logger');

var build = require('../js/build');
var serve = require("./serve");

/*
* For offline testing: build -> serve
*/
module.exports = function test(options) {
    logger.command("Creating offline test build");
    async.series([
        build,
        serve
    ]);
};
