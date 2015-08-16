var log = require("../js/logger");
var open = require("open");

var config = require("../js/config");

/*
* Opens site in browser
*/
module.exports = function launch(options) {
    log("Navigating to " + config.server.url + config.server.base);
    open(config.server.url + config.server.base);
};
