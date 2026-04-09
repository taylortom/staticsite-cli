import config from '../js/config.js';
import logger from '../js/logger.js';
import open from 'open';

/*
* @name launch
* @description Opens site in browser
*/
export default async function launch(args) {
  logger.task("Navigating to " + logger.var(config.server.url));
  await open(config.server.url);
};
