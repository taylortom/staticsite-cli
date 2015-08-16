var async = require("async");
var logger = require("../js/logger");

var build = require("../js/build.js");
var save = require("../js/save.js");
var upload = require("../js/upload.js");

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
            if(error) logger.log(error);
            else logger.done("Site published");
        });
    });
};
