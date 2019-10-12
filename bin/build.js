var async = require("async");
var config = require("../js/config");
var logger = require("../js/logger");

// sub-tasks
var clean = require("./clean");
var compile = require("./compile");
var copy = require("./copy");

/*
* @name build
* @description Shortcut for clean + copy + compile
* @args --dir: site source directory
*/
module.exports = function build(args, cbCompiled) {
  if(!config._SRC_DIR) {
    return cbCompiled(`Cannot build, no site source has been specified`);
  }
  clean(args, function(error) {
    logger.info(`Using src at ${config._SRC_DIR}`);
    async.parallel([
      function(done) { compile(args, done); },
      function(done) { copy(args, done); }
    ], cbCompiled);
  });
};
