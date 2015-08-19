var async = require("async");
var logger = require("../js/logger");

var build = require("../js/build");
var save = require("../js/save");
var upload = require("../js/upload");

/*
* Combines: build, save, upload
*/
module.exports = function publish(options) {
    logger.command("Publishing site");
    build(function built(error) {
        async.parallel([
            save,
            upload
        ], function doneAll(error) {
            if(error) logger.error(error);
            else logger.done("Site published");
        });
    });
};
