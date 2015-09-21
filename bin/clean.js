var fs = require("fs-extra");

var config = require("../js/config");
var logger = require("../js/logger");

/*
* Removes everything in _OUTPUT_DIR
*/
module.exports = function clean(args, cbCleaned) {
    fs.emptyDir(config._OUTPUT_DIR, function removed(error) {
        if(!error) logger.debug("Cleaned output directory");
        cbCleaned(error);
    })
};
