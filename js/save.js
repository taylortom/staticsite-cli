var config = require("../js/config.js");
var logger = require("./logger");

module.exports = function save(cbSaved) {
    logger.task("This will push files to " + logger.var(config.repos.site));
    cbSaved();
};
