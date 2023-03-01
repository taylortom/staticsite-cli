import async from 'async';
import config from '../js/config.js';
import fs from 'fs-extra';
import logger from '../js/logger.js';
import path from 'path';

/*
* @name copy
* @description Copies files/folders in _SRC_DIR not prefixed with _ or . or blacklisted
*/
export default function copy(args, cbCopied) {
  fs.readdir(config._SRC_DIR, function read(error, files) {
    if(error) return cbCopied(error);

    async.each(files, function iterator(file, cbDoneLoop) {
      var options = { clobber: true, preserveTimestamps: true };
      // skip blacklisted files/files beginning with . or _
      if(config.blacklist.includes(file) || file.match(/^\.|^_/)) {
        return cbDoneLoop();
      }
      fs.copy(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR, file), options, function(error) {
        if(error) return cbCopied(error);
        logger.debug("Copied " + logger.file(file));
        cbDoneLoop();
      });
    }, cbCopied);
  });
};
