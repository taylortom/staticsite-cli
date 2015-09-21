var async = require("async");
var fs = require("fs-extra");
var path = require("path");

var config = require("../js/config");
var logger = require("../js/logger");

/*
* Copy files/folders in _SRC_DIR not prefixed with _/. or blacklisted
*/
module.exports = function copy(args, cbCopied) {
    var blacklist = [ "README.md" ];

    fs.readdir(config._SRC_DIR, function read(error, files) {
        if(error) return cbCopied(error);

        async.each(files, function iterator(file, cbDoneLoop) {
            var options = { clobber: true, preserveTimestamps: true };
            var blacklisted = blacklist.indexOf(file) !== -1;

            if(!blacklisted && !file.match(/^\.|^_/)) {
                fs.copy(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR, file), options, function(error) {
                    if(error) return cbCopied(error);
                    logger.debug("Copied " + logger.file(file));
                    cbDoneLoop();
                });
            } else  {
                return cbDoneLoop();
            }
        }, cbCopied);
    });
};
