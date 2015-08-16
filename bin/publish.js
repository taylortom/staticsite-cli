var async = require("async");
var log = require("../js/logger.js");

var build = require("../js/build.js");
var save = require("../js/save.js");
var upload = require("../js/upload.js");

/*
* Combines: build, save, upload
*/
module.exports = function publish(options) {
    log("publishing...");
    build(function(error) {
        async.parallel([
            save,
            upload
        ], function(error) {
            log("site published!");
        });
    });
};
