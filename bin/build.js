var async = require("async");
var logger = require("../js/logger");

// sub-tasks
var clean = require("./clean");
var compile = require("./compile");
var copy = require("./copy");

/*
* @name build
* @description Shortcut for clean + copy + compile
*/
module.exports = function build(args, cbCompiled) {
  clean(args, function(error) {
    async.parallel([
      function(done) { compile(args, done); },
      function(done) { copy(args, done); }
    ], cbCompiled);
  });
};
