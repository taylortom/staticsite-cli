import config from '../js/config';
import logger from '../js/logger';

/*
* @name save
* @description TODO: Pushes any site changes to git
*/
export default function save(args, cbSaved) {
  logger.task("This will push files to " + logger.var(config.repos.site));
  cbSaved();
};
