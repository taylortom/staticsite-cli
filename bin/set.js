var config = require("../js/config");
var packageJSON = require("../package.json");

/*
* @name set
* @description Sets config options from the command line
*/
module.exports = function set(args, cbDone) {
    var toSet = args.slice(1);
    config.set(args);
    cbDone(); // sync, so safe to do this
};
