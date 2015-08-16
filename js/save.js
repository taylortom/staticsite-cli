var config = require("./config");
var logger = require("./logger");

/*
* Pushes any site changes to git
*/
module.exports = function save(cbSaved) {
    logger.task("This will push files to " + logger.var(config.repos.site));
    cbSaved();
};
