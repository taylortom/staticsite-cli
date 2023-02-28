import async from 'async';
import clean from './clean';
import compile from './compile.js';
import config from '../js/config.js';
import copy from './copy.js';
import logger from '../js/logger.js';

/*
* @name build
* @description Shortcut for clean + copy + compile
* @args --dir: site source directory
*/
export default function build(args, cbCompiled) {
  if(!config._SRC_DIR) {
    return cbCompiled(`Cannot build, no site source has been specified`);
  }
  clean(args, function(error) {
    logger.info(`Using src at ${config._SRC_DIR}`);
    async.parallel([
      function(done) { compile(args, done); },
      function(done) { copy(args, done); }
    ], cbCompiled);
  });
};
