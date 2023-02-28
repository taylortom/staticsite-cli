import config from '../js/config.js';
import logger from '../js/logger.js';

/*
* @name save
* @description TODO: Pushes any site changes to git
*/
export default function save(args, cbSaved) {
  logger.task("This will push files to " + logger.var(config.repos.site));
  cbSaved();
};
