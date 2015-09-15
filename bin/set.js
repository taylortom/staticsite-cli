var path = require("path");
var fs = require('fs')

var config = require("../js/config");
var logger = require("../js/logger");
var packageJSON = require("../package.json");

/*
* Set config options from the command line
*/
module.exports = function set(args, cbDone) {
    for(var key in args) {
        if(key === "_") continue;
        logger.info("Set " + logger.var(key) + " to " + logger.file(args[key]));
        config[key] = packageJSON[key] = args[key];
    }
    fs.writeFile(path.join(config._CLI_ROOT, 'package.json'), JSON.stringify(packageJSON, null, "    "), cbDone);
};
