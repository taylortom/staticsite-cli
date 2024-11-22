import clean from './clean.js';
import compile from './compile.js';
import config from '../js/config.js';
import copy from './copy.js';
import logger from '../js/logger.js';

/*
* @name build
* @description Shortcut for clean + copy + compile
* @args --dir: site source directory
*/
export default async function build(args) {
  if(!config._SRC_DIR) {
    throw new Error(`Cannot build, no site source has been specified`);
  }
  await clean(args);
  logger.info(`Using src at ${config._SRC_DIR}`);
  await compile(args);
  await copy(args);
};
