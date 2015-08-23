var async = require("async");

// sub-tasks
var clean = require("./clean");
var compile = require("./compile");
var copy = require("./copy");

var logger = require("../js/logger");
var logger = require("../js/logger");

module.exports = function build(args, cbCompiled) {
    clean(args, function(error) {
        async.parallel([
            function(done) {
                compile(args, done);
            },
            function(done) {
                copy(args, done);
            }
        ], cbCompiled);
    });
};
