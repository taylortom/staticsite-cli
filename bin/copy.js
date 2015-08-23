var async = require("async");
var fs = require("fs.extra");
var path = require("path");

var config = require("../js/config");
var logger = require("../js/logger");

/*
* Copy files/folders in _SRC_DIR not prefixed with _
* (except the _root folder...)
*/
module.exports = function copy(args, cbCopied) {
    fs.readdir(config._SRC_DIR, function read(error, files) {
        if(error) return cbCopied(error);
        async.each(files, function iterator(file, cbDoneLoop) {
            var isDir = fs.statSync(path.join(config._SRC_DIR, file)).isDirectory();
            if(isDir && file[0] !== '_' && file[0] !== '.') {
                fs.copyRecursive(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR, file), function(error) {
                    if(error) return cbCopied(error);
                    logger.debug("Copied " + file);
                    cbDoneLoop();
                });
            } else if(file === "_root") { // TODO remove this dirty, dirty check
                fs.copyRecursive(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR), function(error) {
                    if(error) return cbCopied(error);
                    logger.debug("Copied " + file);
                    cbDoneLoop();
                });
            } else  {
                return cbDoneLoop();
            }
        }, cbCopied);
    });
};
