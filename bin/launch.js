var logger = require("../js/logger");
var open = require("open");

var config = require("../js/config");

/*
* Opens site in browser
*/
module.exports = function launch(options) {
    logger.done("Navigating to " + logger.var(config.server.url + config.server.base));
    open(config.server.url + config.server.base);
};
