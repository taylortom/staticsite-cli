var config = require("../js/config");
var logger = require("../js/logger");

/*
* @name save
* @description TODO: Pushes any site changes to git
*/
module.exports = function save(args, cbSaved) {
  logger.task("This will push files to " + logger.var(config.repos.site));
  cbSaved();
};
