import config from '../js/config.js';
import logger from '../js/logger.js';
import opn from 'opn';

/*
* @name launch
* @description Opens site in browser
*/
export default function launch(args) {
  logger.task("Navigating to " + logger.var(config.server.url));
  opn(config.server.url);
};
